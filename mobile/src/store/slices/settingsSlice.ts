import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig } from '../../../../shared/src/types';
import { STORAGE_KEYS } from '../../config/constants';

interface SettingsState {
  config: AppConfig;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    syncAlerts: boolean;
    reportReminders: boolean;
    locationUpdates: boolean;
  };
  privacy: {
    shareLocation: boolean;
    shareAnalytics: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

const defaultConfig: AppConfig = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
  ocrProvider: 'tesseract',
  maxOfflineStorage: 100 * 1024 * 1024, // 100MB
  syncInterval: 60000, // 1 minute
  locationUpdateInterval: 30000, // 30 seconds
  enableAnalytics: true,
};

const initialState: SettingsState = {
  config: defaultConfig,
  theme: 'system',
  notifications: {
    enabled: true,
    syncAlerts: true,
    reportReminders: true,
    locationUpdates: false,
  },
  privacy: {
    shareLocation: true,
    shareAnalytics: true,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        return JSON.parse(settingsJson) as SettingsState;
      }
      return initialState;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load settings');
    }
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Partial<SettingsState>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { settings: SettingsState };
      const updatedSettings = { ...state.settings, ...settings };
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(updatedSettings)
      );
      return updatedSettings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save settings');
    }
  }
);

export const resetSettings = createAsyncThunk(
  'settings/resetSettings',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
      return initialState;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setConfig: (state, action: PayloadAction<Partial<AppConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    setNotifications: (
      state,
      action: PayloadAction<Partial<SettingsState['notifications']>>
    ) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setPrivacy: (
      state,
      action: PayloadAction<Partial<SettingsState['privacy']>>
    ) => {
      state.privacy = { ...state.privacy, ...action.payload };
    },
    setOCRProvider: (
      state,
      action: PayloadAction<'tesseract' | 'google-vision' | 'aws-textract'>
    ) => {
      state.config.ocrProvider = action.payload;
    },
    setSyncInterval: (state, action: PayloadAction<number>) => {
      state.config.syncInterval = action.payload;
    },
    setLocationUpdateInterval: (state, action: PayloadAction<number>) => {
      state.config.locationUpdateInterval = action.payload;
    },
    setMaxOfflineStorage: (state, action: PayloadAction<number>) => {
      state.config.maxOfflineStorage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load Settings
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        Object.assign(state, action.payload);
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Save Settings
    builder
      .addCase(saveSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        Object.assign(state, action.payload);
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset Settings
    builder
      .addCase(resetSettings.fulfilled, (state) => {
        Object.assign(state, initialState);
      });
  },
});

export const {
  setTheme,
  setConfig,
  setNotifications,
  setPrivacy,
  setOCRProvider,
  setSyncInterval,
  setLocationUpdateInterval,
  setMaxOfflineStorage,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
