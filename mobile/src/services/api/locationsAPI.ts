import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GPSLocation, RouteHistory, ApiResponse, PaginationInfo } from '../../../../shared/src/types';
import { API_BASE_URL, STORAGE_KEYS } from '../../config/constants';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use(async (config) => {
  const tokensJson = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
  if (tokensJson) {
    const tokens = JSON.parse(tokensJson);
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

interface LocationsListResponse {
  locations: GPSLocation[];
  pagination: PaginationInfo;
}

export const locationsAPI = {
  async list(
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 100
  ): Promise<LocationsListResponse> {
    const response = await apiClient.get<ApiResponse<LocationsListResponse>>('/locations', {
      params: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        page,
        limit,
      },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch locations');
    }
    return response.data.data;
  },

  async create(location: Omit<GPSLocation, 'id'>): Promise<GPSLocation> {
    const response = await apiClient.post<ApiResponse<GPSLocation>>('/locations', location);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create location');
    }
    return response.data.data;
  },

  async batchCreate(locations: GPSLocation[]): Promise<{ created: number; failed: number }> {
    const response = await apiClient.post<ApiResponse<{ created: number; failed: number }>>(
      '/locations/batch',
      { locations }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to batch create locations');
    }
    return response.data.data;
  },

  async getRouteHistory(
    startDate: Date,
    endDate: Date
  ): Promise<RouteHistory[]> {
    const response = await apiClient.get<ApiResponse<RouteHistory[]>>('/locations/routes', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch route history');
    }
    return response.data.data;
  },

  async getCurrentStats(): Promise<{
    totalLocations: number;
    totalDistance: number;
    todayLocations: number;
    todayDistance: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      totalLocations: number;
      totalDistance: number;
      todayLocations: number;
      todayDistance: number;
    }>>('/locations/stats');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch location stats');
    }
    return response.data.data;
  },
};
