import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OCRResult, DocumentType } from '../../../../shared/src/types';
import { OCRService } from '../../services/OCRService';
import { SyncService } from '../../services/SyncService';

interface OCRState {
  results: OCRResult[];
  currentResult: OCRResult | null;
  isProcessing: boolean;
  error: string | null;
  processingProgress: number;
}

const initialState: OCRState = {
  results: [],
  currentResult: null,
  isProcessing: false,
  error: null,
  processingProgress: 0,
};

// Async thunks
export const processImage = createAsyncThunk(
  'ocr/processImage',
  async (imageUri: string, { rejectWithValue }) => {
    try {
      const result = await OCRService.processImage(imageUri);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'OCR processing failed');
    }
  }
);

export const processMultipleImages = createAsyncThunk(
  'ocr/processMultipleImages',
  async (imageUris: string[], { dispatch, rejectWithValue }) => {
    try {
      const results: OCRResult[] = [];

      for (let i = 0; i < imageUris.length; i++) {
        dispatch(setProcessingProgress(((i + 1) / imageUris.length) * 100));
        const result = await OCRService.processImage(imageUris[i]);
        results.push(result);
      }

      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Batch OCR processing failed');
    }
  }
);

export const saveOCRResult = createAsyncThunk(
  'ocr/saveOCRResult',
  async (result: OCRResult, { rejectWithValue }) => {
    try {
      // Queue for sync
      await SyncService.queueOCRResult(result);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save OCR result');
    }
  }
);

const ocrSlice = createSlice({
  name: 'ocr',
  initialState,
  reducers: {
    setCurrentResult: (state, action: PayloadAction<OCRResult | null>) => {
      state.currentResult = action.payload;
    },
    addResult: (state, action: PayloadAction<OCRResult>) => {
      state.results.unshift(action.payload);
    },
    updateResult: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<OCRResult> }>
    ) => {
      const index = state.results.findIndex((r) => r.id === action.payload.id);
      if (index >= 0) {
        state.results[index] = { ...state.results[index], ...action.payload.updates };
      }
      if (state.currentResult?.id === action.payload.id) {
        state.currentResult = { ...state.currentResult, ...action.payload.updates };
      }
    },
    removeResult: (state, action: PayloadAction<string>) => {
      state.results = state.results.filter((r) => r.id !== action.payload);
      if (state.currentResult?.id === action.payload) {
        state.currentResult = null;
      }
    },
    setProcessingProgress: (state, action: PayloadAction<number>) => {
      state.processingProgress = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.currentResult = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Process Image
    builder
      .addCase(processImage.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
        state.processingProgress = 0;
      })
      .addCase(processImage.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentResult = action.payload;
        state.results.unshift(action.payload);
        state.processingProgress = 100;
      })
      .addCase(processImage.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
        state.processingProgress = 0;
      });

    // Process Multiple Images
    builder
      .addCase(processMultipleImages.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
        state.processingProgress = 0;
      })
      .addCase(processMultipleImages.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.results = [...action.payload, ...state.results];
        state.processingProgress = 100;
      })
      .addCase(processMultipleImages.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
        state.processingProgress = 0;
      });

    // Save OCR Result
    builder.addCase(saveOCRResult.fulfilled, (state, action) => {
      const index = state.results.findIndex((r) => r.id === action.payload.id);
      if (index < 0) {
        state.results.unshift(action.payload);
      }
    });
  },
});

export const {
  setCurrentResult,
  addResult,
  updateResult,
  removeResult,
  setProcessingProgress,
  clearResults,
  clearError,
} = ocrSlice.actions;

export default ocrSlice.reducer;
