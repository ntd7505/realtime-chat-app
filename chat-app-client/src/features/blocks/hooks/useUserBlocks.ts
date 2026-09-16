import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { chatKeys } from '@/features/chat/chat.keys';
import { friendshipKeys } from '@/features/friends/hooks/useFriendships';
import { userBlockApi } from '../api/userBlockApi';

export const userBlockKeys = {
  root: ['user-blocks'] as const,
  all: (userId: number) => [...userBlockKeys.root, userId] as const,
  list: (userId: number) => [...userBlockKeys.all(userId), 'list'] as const,
};

export const useBlockedUsers = () => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useQuery({
    queryKey: userBlockKeys.list(userId),
    queryFn: userBlockApi.getBlockedUsers,
    enabled: isAuthenticated,
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: userBlockApi.block,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userBlockKeys.all(userId) }),
        queryClient.invalidateQueries({ queryKey: friendshipKeys.all(userId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.all(userId) }),
      ]);
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: userBlockApi.unblock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userBlockKeys.all(userId) }),
  });
};
