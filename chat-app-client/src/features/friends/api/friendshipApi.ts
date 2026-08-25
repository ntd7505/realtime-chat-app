import { apiClient } from '@/lib/http/apiClient';
import type { ApiResponse } from '@/types/api.types';
import type { UserSummary } from '@/features/users/user.types';
import type { Friendship } from '../friendship.types';

export const friendshipApi = {
  getFriends: async (): Promise<UserSummary[]> => {
    const response = await apiClient.get<ApiResponse<UserSummary[]>>('/friends');
    return response.data.data;
  },

  getReceivedRequests: async (): Promise<UserSummary[]> => {
    const response = await apiClient.get<ApiResponse<UserSummary[]>>(
      '/friends/requests/received'
    );
    return response.data.data;
  },

  sendRequest: async (userId: number): Promise<Friendship> => {
    const response = await apiClient.post<ApiResponse<Friendship>>(
      `/friends/requests/${userId}`
    );
    return response.data.data;
  },

  acceptRequest: async (requesterId: number): Promise<Friendship> => {
    const response = await apiClient.patch<ApiResponse<Friendship>>(
      `/friends/requests/${requesterId}/accept`
    );
    return response.data.data;
  },

  cancelRequest: async (userId: number): Promise<void> => {
    await apiClient.delete(`/friends/requests/${userId}`);
  },

  unfriend: async (userId: number): Promise<void> => {
    await apiClient.delete(`/friends/${userId}`);
  },
};
