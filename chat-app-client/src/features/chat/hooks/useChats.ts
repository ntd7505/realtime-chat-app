import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp } from '@/lib/websocket/stompContext';
import type { SendMessageRequest, Message } from '../chat.types';
import { chatApi, validateSendMessageRequest } from '../api/chatApi';
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
  const { publish, subscribe } = useStomp();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: ({ chatId, ...request }: SendMessageVariables) => {
      if (!Number.isInteger(chatId) || chatId <= 0) {
        throw new TypeError('chatId must be a positive integer');
      }
      validateSendMessageRequest(request);

      return new Promise<void>((resolve, reject) => {
        const topic = `/topic/chats/${chatId}`;
        let unsubscribe: () => void = () => {};

        const timeoutId = window.setTimeout(async () => {
          unsubscribe();

          try {
            const latestMessages = await chatApi.getMessages(chatId, { limit: 30 });
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: chatKeys.messages(userId, chatId) }),
              queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) }),
            ]);

            const wasPersisted = latestMessages.items.some(
              (message) => message.clientMessageId === request.clientMessageId
            );

            if (wasPersisted) {
              resolve();
              return;
            }

            reject(new Error('The server did not confirm the message in time'));
          } catch (error) {
            reject(error);
          }
        }, 10_000);

        unsubscribe = subscribe(topic, (frame) => {
          let receivedClientMessageId: string | undefined;

          try {
            receivedClientMessageId = (JSON.parse(frame.body) as { clientMessageId?: string })
              .clientMessageId;
          } catch {
            return;
          }

          if (receivedClientMessageId !== request.clientMessageId) {
            return;
          }

          window.clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        });

        try {
          publish(`/app/chats/${chatId}/messages`, JSON.stringify(request));
        } catch (error) {
          window.clearTimeout(timeoutId);
          unsubscribe();
          reject(error);
        }
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(userId, variables.chatId) });
      const previousMessages = queryClient.getQueryData(chatKeys.messages(userId, variables.chatId));

      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return { previousMessages };

      const optimisticMessage: Message = {
        id: Date.now(),
        clientMessageId: variables.clientMessageId,
        content: variables.content,
        sender: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
        },
        createdAt: new Date().toISOString(),
        status: 'sending'
      };

      queryClient.setQueryData(chatKeys.messages(userId, variables.chatId), (old: any) => {
        if (!old || !old.pages) return old;
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            items: [optimisticMessage, ...newPages[0].items]
          };
        }
        return { ...old, pages: newPages };
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (_err, variables, _context: any) => {
      queryClient.setQueryData(chatKeys.messages(userId, variables.chatId), (old: any) => {
        if (!old || !old.pages) return old;
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            items: newPages[0].items.map((msg: Message) =>
              msg.clientMessageId === variables.clientMessageId
                ? { ...msg, status: 'failed' }
                : msg
            )
          };
        }
        return { ...old, pages: newPages };
      });
    },
    onSuccess: (_data, variables, _context) => {
      queryClient.setQueryData(chatKeys.messages(userId, variables.chatId), (old: any) => {
        if (!old || !old.pages) return old;
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            items: newPages[0].items.map((msg: Message) =>
              msg.clientMessageId === variables.clientMessageId && msg.status === 'sending'
                ? { ...msg, status: 'sent' }
                : msg
            )
          };
        }
        return { ...old, pages: newPages };
      });
    }
  });
};
