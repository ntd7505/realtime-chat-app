import { apiClient } from '@/lib/http/apiClient';
import type { RegisterRequest, LoginRequest, LoginResponse, AuthenticatedUser } from '../auth.types';
import type { ApiResponse } from '@/types/api.types';


export const authApi = {
  register: async (request: RegisterRequest): Promise<AuthenticatedUser> => {
    const response = await apiClient.post<ApiResponse<AuthenticatedUser>>('/auth/register', request);
    return response.data.data;
  },

  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', request);
    return response.data.data;
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', undefined, {
      skipAuthRefresh: true,
    });
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  csrf: async (): Promise<void> => {
    await apiClient.get('/auth/csrf');
  }
};
