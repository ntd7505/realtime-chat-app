import { apiClient } from '@/lib/http/apiClient';
import type { ApiResponse } from '@/types/api.types';
import type { UserSummary } from '@/features/users/user.types';

export const userBlockApi = {
  getBlockedUsers: async (): Promise<UserSummary[]> => {
    const response = await apiClient.get<ApiResponse<UserSummary[]>>('/users/blocked');
    return response.data.data;
  },

  block: async (userId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/block`);
  },

  unblock: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/block`);
  },
};
