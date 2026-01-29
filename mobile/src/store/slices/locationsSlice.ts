import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GPSLocation, RouteHistory } from '../../../../shared/src/types';
import { locationsAPI } from '../../services/api/locationsAPI';
import { LocationService } from '../../services/LocationService';
import { SyncService } from '../../services/SyncService';

interface LocationsState {
  locations: GPSLocation[];
  currentLocation: GPSLocation | null;
  routeHistory: RouteHistory[];
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
  stats: {
    totalLocations: number;
    totalDistance: number;
    todayLocations: number;
    todayDistance: number;
  };
}

const initialState: LocationsState = {
  locations: [],
  currentLocation: null,
  routeHistory: [],
  isTracking: false,
  isLoading: false,
  error: null,
  stats: {
    totalLocations: 0,
    totalDistance: 0,
    todayLocations: 0,
    todayDistance: 0,
  },
};

// Async thunks
export const fetchLocations = createAsyncThunk(
  'locations/fetchLocations',
  async (
    { startDate, endDate }: { startDate?: Date; endDate?: Date },
    { rejectWithValue }
  ) => {
    try {
      const response = await locationsAPI.list(startDate, endDate);
      return response.locations;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch locations');
    }
  }
);

export const fetchRouteHistory = createAsyncThunk(
  'locations/fetchRouteHistory',
  async (
    { startDate, endDate }: { startDate: Date; endDate: Date },
    { rejectWithValue }
  ) => {
    try {
      const routes = await locationsAPI.getRouteHistory(startDate, endDate);
      return routes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch route history');
    }
  }
);

export const fetchLocationStats = createAsyncThunk(
  'locations/fetchLocationStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await locationsAPI.getCurrentStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch location stats');
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'locations/getCurrentLocation',
  async (userId: string, { rejectWithValue }) => {
    try {
      const location = await LocationService.getCurrentLocation();
      const address = await LocationService.reverseGeocode(
        location.latitude,
        location.longitude
      );

      const gpsLocation: GPSLocation = {
        ...location,
        userId,
        address: address || undefined,
      };

      return gpsLocation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get current location');
    }
  }
);

export const saveLocation = createAsyncThunk(
  'locations/saveLocation',
  async (location: GPSLocation, { rejectWithValue }) => {
    try {
      const savedLocation = await locationsAPI.create(location);
      return savedLocation;
    } catch (error: any) {
      // Queue for offline sync
      await SyncService.queueLocation(location);
      return location;
    }
  }
);

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<GPSLocation>) => {
      state.currentLocation = action.payload;
    },
    addLocation: (state, action: PayloadAction<GPSLocation>) => {
      state.locations.unshift(action.payload);
      state.stats.totalLocations += 1;
      state.stats.todayLocations += 1;

      // Calculate distance if there's a previous location
      if (state.locations.length > 1) {
        const prev = state.locations[1];
        const distance = LocationService.calculateDistance(
          prev.latitude,
          prev.longitude,
          action.payload.latitude,
          action.payload.longitude
        );
        state.stats.totalDistance += distance;
        state.stats.todayDistance += distance;
      }
    },
    startTracking: (state) => {
      state.isTracking = true;
    },
    stopTracking: (state) => {
      state.isTracking = false;
    },
    clearLocations: (state) => {
      state.locations = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Locations
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Route History
    builder
      .addCase(fetchRouteHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRouteHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.routeHistory = action.payload;
      })
      .addCase(fetchRouteHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Location Stats
    builder.addCase(fetchLocationStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });

    // Get Current Location
    builder
      .addCase(getCurrentLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLocation = action.payload;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Save Location
    builder.addCase(saveLocation.fulfilled, (state, action) => {
      state.locations.unshift(action.payload);
    });
  },
});

export const {
  setCurrentLocation,
  addLocation,
  startTracking,
  stopTracking,
  clearLocations,
  clearError,
} = locationsSlice.actions;

export default locationsSlice.reducer;
