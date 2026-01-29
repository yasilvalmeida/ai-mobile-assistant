import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FieldReport, ApiResponse, PaginationInfo, SearchFilters } from '../../../../shared/src/types';
import { API_BASE_URL, STORAGE_KEYS } from '../../config/constants';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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

interface ReportsListResponse {
  reports: FieldReport[];
  pagination: PaginationInfo;
}

export const reportsAPI = {
  async list(
    filters?: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<ReportsListResponse> {
    const response = await apiClient.get<ApiResponse<ReportsListResponse>>('/reports', {
      params: {
        ...filters,
        page,
        limit,
      },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch reports');
    }
    return response.data.data;
  },

  async get(id: string): Promise<FieldReport> {
    const response = await apiClient.get<ApiResponse<FieldReport>>(`/reports/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch report');
    }
    return response.data.data;
  },

  async create(report: Omit<FieldReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<FieldReport> {
    const response = await apiClient.post<ApiResponse<FieldReport>>('/reports', report);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create report');
    }
    return response.data.data;
  },

  async update(id: string, report: Partial<FieldReport>): Promise<FieldReport> {
    const response = await apiClient.patch<ApiResponse<FieldReport>>(`/reports/${id}`, report);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update report');
    }
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/reports/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete report');
    }
  },

  async uploadAttachment(
    reportId: string,
    file: { uri: string; name: string; type: string }
  ): Promise<{ attachmentId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post<ApiResponse<{ attachmentId: string; url: string }>>(
      `/reports/${reportId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to upload attachment');
    }
    return response.data.data;
  },

  async deleteAttachment(reportId: string, attachmentId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(
      `/reports/${reportId}/attachments/${attachmentId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete attachment');
    }
  },

  async getAISummary(reportId: string): Promise<{ summary: string; suggestions: string[] }> {
    const response = await apiClient.post<ApiResponse<{ summary: string; suggestions: string[] }>>(
      `/reports/${reportId}/ai-summary`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to generate AI summary');
    }
    return response.data.data;
  },
};
