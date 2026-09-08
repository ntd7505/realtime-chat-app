import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { CursorPage } from '@/types/pagination.types';
import type { Message } from './chat.types';
import { chatKeys } from './chat.keys';

export type MessageHistory = InfiniteData<CursorPage<Message>, string | null>;

export function updateMessage(
  client: QueryClient, userId: number, chatId: number,
  update: (messages: Message[]) => Message[],
) {
  client.setQueriesData<MessageHistory>({ queryKey: chatKeys.messages(userId, chatId) }, (old) => {
    if (!old?.pages.length) return old;
    return { ...old, pages: old.pages.map((page, index) => ({
      ...page, items: index === 0 ? update(page.items) : page.items,
    })) };
  });
}

export function upsertMessage(client: QueryClient, userId: number, chatId: number, message: Message) {
  client.setQueriesData<MessageHistory>({ queryKey: chatKeys.messages(userId, chatId) }, (old) => {
    if (!old?.pages.length) return old;
    const pages = old.pages.map((page) => ({ ...page, items: page.items.filter(
      (item) => item.clientMessageId !== message.clientMessageId && !(message.id > 0 && item.id === message.id),
    ) }));
    pages[0].items = [message, ...pages[0].items].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id,
    );
    return { ...old, pages };
  });
}
