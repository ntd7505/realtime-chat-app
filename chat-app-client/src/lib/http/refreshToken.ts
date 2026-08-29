import { useAuthStore } from '@/features/auth/authStore';
import { authApi } from '@/features/auth/api/authApi';
import { queryClient } from '@/app/queryClient';

let refreshPromise: Promise<string | null> | null = null;
let refreshGeneration = 0;

export const invalidatePendingRefresh = () => {
  refreshGeneration += 1;
};

export const refreshToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const requestGeneration = refreshGeneration;
  const currentRequest = (async () => {
    try {
      const response = await authApi.refresh();

      if (requestGeneration !== refreshGeneration) {
        return null;
      }

      const { accessToken, user } = response;
      useAuthStore.getState().setSession(accessToken, user);
      return accessToken;
    } catch {
      if (requestGeneration === refreshGeneration) {
        useAuthStore.getState().clearSession();
        queryClient.clear();
      }
      return null;
    }
  })();

  refreshPromise = currentRequest;
  try {
    return await currentRequest;
  } finally {
    if (refreshPromise === currentRequest) {
      refreshPromise = null;
    }
  }
};
