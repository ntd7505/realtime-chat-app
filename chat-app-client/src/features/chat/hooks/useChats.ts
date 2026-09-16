import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp } from '@/lib/websocket/stompContext';
import type { SendMessageRequest, Message, MessageDeliveryEvent } from '../chat.types';
import { chatApi, validateSendMessageRequest } from '../api/chatApi';
import { chatKeys } from '../chat.keys';
import { upsertMessage, updateMessage, type MessageHistory } from '../messageCache';
import { draftKey, useDraftStore } from '../draftStore';

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
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useInfiniteQuery({
    queryKey: chatKeys.messageHistory(userId, chatId, limit),
    queryFn: async ({ pageParam }) => {
      const page = await chatApi.getMessages(chatId, { cursor: pageParam, limit });
      if (pageParam !== null) return page;
      const cached = queryClient.getQueryData<MessageHistory>(chatKeys.messageHistory(userId, chatId, limit));
      const pending = cached?.pages.flatMap((p) => p.items).filter((message) =>
        (message.status === 'sending' || message.status === 'failed') &&
        !page.items.some((item) => item.clientMessageId === message.clientMessageId),
      ) ?? [];
      return { ...page, items: [...pending, ...page.items] };
    },
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

export const useMarkChatRead = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: number; messageId: number }) =>
      chatApi.markAsRead(chatId, messageId),
    onSuccess: (read) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(userId, read.chatId),
          exact: true,
        }),
      ]);
    },
  });
};

interface SendMessageVariables extends SendMessageRequest {
  chatId: number;
}

export const useSendMessage = () => {
  const { publish, subscribe, status } = useStomp();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);

  return useMutation({
    mutationFn: ({ chatId, ...request }: SendMessageVariables) => {
      if (!Number.isInteger(chatId) || chatId <= 0) {
        throw new TypeError('chatId must be a positive integer');
      }
      validateSendMessageRequest(request);
      if (status !== 'connected') throw new Error('Connect before sending. Your draft is saved.');

      return new Promise<Message>((resolve, reject) => {
        const deliveryQueue = '/user/queue/message-events';
        let unsubscribe: () => void = () => {};

        const timeoutId = window.setTimeout(async () => {
          unsubscribe();

          try {
            const latestMessages = await chatApi.getMessages(chatId, { limit: 30 });
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: chatKeys.messages(userId, chatId) }),
              queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) }),
            ]);

            const wasPersisted = latestMessages.items.find(
              (message) => message.clientMessageId === request.clientMessageId
            );

            if (wasPersisted) {
              resolve(wasPersisted);
              return;
            }

            reject(new Error('The server did not confirm the message in time'));
          } catch (error) {
            reject(error);
          }
        }, 10_000);

        unsubscribe = subscribe(deliveryQueue, (frame) => {
          let event: MessageDeliveryEvent;

          try {
            event = JSON.parse(frame.body) as MessageDeliveryEvent;
          } catch {
            return;
          }

          if (event.clientMessageId !== request.clientMessageId || event.chatId !== chatId) {
            return;
          }

          window.clearTimeout(timeoutId);
          unsubscribe();
          if (event.type === 'message.rejected') {
            reject(new Error(event.error || 'The server rejected the message'));
            return;
          }
          if (!event.message?.id || !event.message.sender) {
            reject(new Error('The server returned an invalid message acknowledgement'));
            return;
          }
          resolve(event.message);
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
      const currentUser = useAuthStore.getState().user;
      if (!currentUser || currentUser.id !== userId || status !== 'connected') return;
      validateSendMessageRequest(variables);

      const optimisticMessage: Message = {
        id: -Date.now(),
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

      upsertMessage(queryClient, userId, variables.chatId, optimisticMessage);
    },
    onError: (_err, variables) => {
      if (useAuthStore.getState().user?.id !== userId) return;
      updateMessage(queryClient, userId, variables.chatId, (items) => items.map((msg) =>
        msg.clientMessageId === variables.clientMessageId && msg.status === 'sending'
          ? { ...msg, status: 'failed' } : msg,
      ));
    },
    onSuccess: async (message, variables) => {
      if (useAuthStore.getState().user?.id !== userId) return;
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(userId, variables.chatId) });
      upsertMessage(queryClient, userId, variables.chatId, { ...message, status: 'sent' });
      useDraftStore.getState().confirm(draftKey(userId, variables.chatId), variables.clientMessageId);
      void queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) });
    }
  });
};
