import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SyncStatus, SyncError } from '../../../../shared/src/types';
import { SyncService } from '../../services/SyncService';

interface SyncState {
  syncStatus: SyncStatus;
  isInitialized: boolean;
}

const initialState: SyncState = {
  syncStatus: {
    lastSyncAt: undefined,
    pendingUploads: 0,
    pendingDownloads: 0,
    syncInProgress: false,
    errors: [],
  },
  isInitialized: false,
};

// Async thunks
export const initializeSync = createAsyncThunk(
  'sync/initialize',
  async (_, { dispatch }) => {
    await SyncService.initialize();

    // Set up listener for sync status updates
    SyncService.addListener((status) => {
      dispatch(updateSyncStatus(status));
    });

    // Get initial status
    const status = await SyncService.getSyncStatus();
    return status;
  }
);

export const syncAll = createAsyncThunk(
  'sync/syncAll',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setSyncInProgress(true));
      await SyncService.syncAll();
      const status = await SyncService.getSyncStatus();
      return status;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sync failed');
    }
  }
);

export const refreshSyncStatus = createAsyncThunk(
  'sync/refreshStatus',
  async () => {
    const status = await SyncService.getSyncStatus();
    return status;
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    updateSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.syncStatus = action.payload;
    },
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncStatus.syncInProgress = action.payload;
    },
    incrementPendingUploads: (state) => {
      state.syncStatus.pendingUploads += 1;
    },
    decrementPendingUploads: (state) => {
      state.syncStatus.pendingUploads = Math.max(
        0,
        state.syncStatus.pendingUploads - 1
      );
    },
    addSyncError: (state, action: PayloadAction<SyncError>) => {
      state.syncStatus.errors.push(action.payload);
      // Keep only last 50 errors
      if (state.syncStatus.errors.length > 50) {
        state.syncStatus.errors = state.syncStatus.errors.slice(-50);
      }
    },
    clearSyncErrors: (state) => {
      state.syncStatus.errors = [];
    },
    setLastSyncTime: (state, action: PayloadAction<Date>) => {
      state.syncStatus.lastSyncAt = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize Sync
    builder
      .addCase(initializeSync.fulfilled, (state, action) => {
        state.isInitialized = true;
        state.syncStatus = action.payload;
      });

    // Sync All
    builder
      .addCase(syncAll.pending, (state) => {
        state.syncStatus.syncInProgress = true;
      })
      .addCase(syncAll.fulfilled, (state, action) => {
        state.syncStatus = action.payload;
      })
      .addCase(syncAll.rejected, (state, action) => {
        state.syncStatus.syncInProgress = false;
        state.syncStatus.errors.push({
          id: `err_${Date.now()}`,
          type: 'sync_failed',
          message: action.payload as string,
          timestamp: new Date(),
          retryCount: 0,
        });
      });

    // Refresh Status
    builder.addCase(refreshSyncStatus.fulfilled, (state, action) => {
      state.syncStatus = action.payload;
    });
  },
});

export const {
  updateSyncStatus,
  setSyncInProgress,
  incrementPendingUploads,
  decrementPendingUploads,
  addSyncError,
  clearSyncErrors,
  setLastSyncTime,
} = syncSlice.actions;

export default syncSlice.reducer;
