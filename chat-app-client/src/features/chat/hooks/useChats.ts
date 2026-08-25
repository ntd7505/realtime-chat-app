import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import type { SendMessageRequest } from '../chat.types';
import { chatApi } from '../api/chatApi';
import { chatKeys } from '../chat.keys';

export { chatKeys } from '../chat.keys';

export const useChats = (limit = 20) => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useInfiniteQuery({
    queryKey: chatKeys.list(userId, limit),
    queryFn: ({ pageParam }) => chatApi.getChats({ cursor: pageParam, limit }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    enabled: isAuthenticated,
  });
};

export const useChat = (chatId: number) => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useQuery({
    queryKey: chatKeys.detail(userId, chatId),
    queryFn: () => chatApi.getChatById(chatId),
    enabled: isAuthenticated && Number.isInteger(chatId) && chatId > 0,
  });
};

export const useMessages = (chatId: number, limit = 30) => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useInfiniteQuery({
    queryKey: chatKeys.messageHistory(userId, chatId, limit),
    queryFn: ({ pageParam }) => chatApi.getMessages(chatId, { cursor: pageParam, limit }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    enabled: isAuthenticated && Number.isInteger(chatId) && chatId > 0,
  });
};

export const useCreateDirectChat = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: chatApi.createOrGetDirectChat,
    onSuccess: (chat) => {
      queryClient.setQueryData(chatKeys.detail(userId, chat.id), chat);
      return queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) });
    },
  });
};

interface SendMessageVariables extends SendMessageRequest {
  chatId: number;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: ({ chatId, ...request }: SendMessageVariables) =>
      chatApi.sendMessage(chatId, request),
    onSuccess: async (_message, { chatId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(userId, chatId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(userId, chatId),
          exact: true,
        }),
      ]);
    },
  });
};
