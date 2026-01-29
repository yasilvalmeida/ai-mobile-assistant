import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FieldReport, ReportStatus, SearchFilters } from '../../../../shared/src/types';
import { reportsAPI } from '../../services/api/reportsAPI';
import { SyncService } from '../../services/SyncService';

interface ReportsState {
  reports: FieldReport[];
  currentReport: FieldReport | null;
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  hasMore: boolean;
  page: number;
}

const initialState: ReportsState = {
  reports: [],
  currentReport: null,
  isLoading: false,
  error: null,
  filters: {},
  hasMore: true,
  page: 1,
};

// Async thunks
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { reports: ReportsState };
      const response = await reportsAPI.list(state.reports.filters, 1, 20);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reports');
    }
  }
);

export const fetchMoreReports = createAsyncThunk(
  'reports/fetchMoreReports',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { reports: ReportsState };
      const response = await reportsAPI.list(
        state.reports.filters,
        state.reports.page + 1,
        20
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch more reports');
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'reports/fetchReportById',
  async (reportId: string, { rejectWithValue }) => {
    try {
      const report = await reportsAPI.get(reportId);
      return report;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch report');
    }
  }
);

export const createReport = createAsyncThunk(
  'reports/createReport',
  async (
    report: Omit<FieldReport, 'id' | 'createdAt' | 'updatedAt'>,
    { rejectWithValue }
  ) => {
    try {
      const createdReport = await reportsAPI.create(report);
      return createdReport;
    } catch (error: any) {
      // If offline, create locally
      const offlineReport: FieldReport = {
        ...report,
        id: `offline_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await SyncService.queueReport(offlineReport);
      return offlineReport;
    }
  }
);

export const updateReport = createAsyncThunk(
  'reports/updateReport',
  async (
    { id, updates }: { id: string; updates: Partial<FieldReport> },
    { rejectWithValue }
  ) => {
    try {
      const updatedReport = await reportsAPI.update(id, updates);
      return updatedReport;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update report');
    }
  }
);

export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (reportId: string, { rejectWithValue }) => {
    try {
      await reportsAPI.delete(reportId);
      return reportId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete report');
    }
  }
);

export const generateAISummary = createAsyncThunk(
  'reports/generateAISummary',
  async (reportId: string, { rejectWithValue }) => {
    try {
      const summary = await reportsAPI.getAISummary(reportId);
      return { reportId, ...summary };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate AI summary');
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
      state.page = 1;
      state.hasMore = true;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.page = 1;
      state.hasMore = true;
    },
    setCurrentReport: (state, action: PayloadAction<FieldReport | null>) => {
      state.currentReport = action.payload;
    },
    addLocalReport: (state, action: PayloadAction<FieldReport>) => {
      state.reports.unshift(action.payload);
    },
    updateLocalReport: (state, action: PayloadAction<FieldReport>) => {
      const index = state.reports.findIndex((r) => r.id === action.payload.id);
      if (index >= 0) {
        state.reports[index] = action.payload;
      }
      if (state.currentReport?.id === action.payload.id) {
        state.currentReport = action.payload;
      }
    },
    removeLocalReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter((r) => r.id !== action.payload);
      if (state.currentReport?.id === action.payload) {
        state.currentReport = null;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Reports
    builder
      .addCase(fetchReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload.reports;
        state.hasMore = action.payload.pagination.hasNext;
        state.page = 1;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch More Reports
    builder
      .addCase(fetchMoreReports.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMoreReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = [...state.reports, ...action.payload.reports];
        state.hasMore = action.payload.pagination.hasNext;
        state.page += 1;
      })
      .addCase(fetchMoreReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Report By ID
    builder
      .addCase(fetchReportById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchReportById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Report
    builder
      .addCase(createReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports.unshift(action.payload);
        state.currentReport = action.payload;
      })
      .addCase(createReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Report
    builder
      .addCase(updateReport.fulfilled, (state, action) => {
        const index = state.reports.findIndex((r) => r.id === action.payload.id);
        if (index >= 0) {
          state.reports[index] = action.payload;
        }
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      });

    // Delete Report
    builder.addCase(deleteReport.fulfilled, (state, action) => {
      state.reports = state.reports.filter((r) => r.id !== action.payload);
      if (state.currentReport?.id === action.payload) {
        state.currentReport = null;
      }
    });

    // Generate AI Summary
    builder.addCase(generateAISummary.fulfilled, (state, action) => {
      const index = state.reports.findIndex((r) => r.id === action.payload.reportId);
      if (index >= 0) {
        state.reports[index].aiSummary = action.payload.summary;
        state.reports[index].aiSuggestions = action.payload.suggestions;
      }
      if (state.currentReport?.id === action.payload.reportId) {
        state.currentReport.aiSummary = action.payload.summary;
        state.currentReport.aiSuggestions = action.payload.suggestions;
      }
    });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentReport,
  addLocalReport,
  updateLocalReport,
  removeLocalReport,
  clearError,
} = reportsSlice.actions;

export default reportsSlice.reducer;
