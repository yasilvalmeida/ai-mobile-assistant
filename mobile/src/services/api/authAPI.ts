import axios, { AxiosInstance } from 'axios';
import { User, AuthTokens, LoginRequest, RegisterRequest, ApiResponse } from '../../../../shared/src/types';
import { API_BASE_URL } from '../../config/constants';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

interface RegisterResponse {
  user: User;
  message: string;
}

export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', userData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data;
  },

  async refreshToken(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    const response = await apiClient.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', {
      refreshToken,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Token refresh failed');
    }
    return response.data.data;
  },

  async getProfile(accessToken: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to get profile');
    }
    return response.data.data;
  },

  async logout(accessToken: string): Promise<void> {
    await apiClient.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },

  async changePassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await apiClient.post<ApiResponse>(
      '/auth/change-password',
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password change failed');
    }
  },
};
