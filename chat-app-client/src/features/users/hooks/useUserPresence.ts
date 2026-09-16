import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { userApi } from '../api/userApi';

const PRESENCE_REFRESH_INTERVAL_MS = 15_000;
const PRESENCE_STALE_TIME_MS = 10_000;

export const useUserPresence = (userIds: number[]) => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const normalizedUserIds = [...new Set(userIds)]
    .filter((userId) => Number.isInteger(userId) && userId > 0)
    .sort((left, right) => left - right);

  return useQuery({
    queryKey: ['users', 'presence', normalizedUserIds],
    queryFn: () => userApi.getPresence(normalizedUserIds),
    enabled: isAuthenticated && normalizedUserIds.length > 0,
    staleTime: PRESENCE_STALE_TIME_MS,
    refetchInterval: PRESENCE_REFRESH_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });
};
