import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { chatKeys } from '@/features/chat/chat.keys';
import { friendshipApi } from '../api/friendshipApi';

export const friendshipKeys = {
  root: ['friendships'] as const,
  all: (userId: number) => [...friendshipKeys.root, userId] as const,
  friends: (userId: number) => [...friendshipKeys.all(userId), 'friends'] as const,
  receivedRequests: (userId: number) =>
    [...friendshipKeys.all(userId), 'requests', 'received'] as const,
};

const useFriendshipMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: friendshipKeys.all(userId) }),
  });
};

export const useFriends = () => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useQuery({
    queryKey: friendshipKeys.friends(userId),
    queryFn: friendshipApi.getFriends,
    enabled: isAuthenticated,
  });
};

export const useReceivedFriendRequests = () => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useQuery({
    queryKey: friendshipKeys.receivedRequests(userId),
    queryFn: friendshipApi.getReceivedRequests,
    enabled: isAuthenticated,
  });
};

export const useSendFriendRequest = () =>
  useFriendshipMutation(friendshipApi.sendRequest);

export const useAcceptFriendRequest = () =>
  useFriendshipMutation(friendshipApi.acceptRequest);

export const useCancelFriendRequest = () =>
  useFriendshipMutation(friendshipApi.cancelRequest);

export const useUnfriend = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: friendshipApi.unfriend,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: friendshipKeys.all(userId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.all(userId) }),
      ]);
    },
  });
};
