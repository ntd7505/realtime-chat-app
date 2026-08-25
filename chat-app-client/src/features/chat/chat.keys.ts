export const chatKeys = {
  root: ['chats'] as const,
  all: (userId: number) => [...chatKeys.root, userId] as const,
  lists: (userId: number) => [...chatKeys.all(userId), 'list'] as const,
  list: (userId: number, limit: number) => [...chatKeys.lists(userId), { limit }] as const,
  details: (userId: number) => [...chatKeys.all(userId), 'detail'] as const,
  detail: (userId: number, chatId: number) => [...chatKeys.details(userId), chatId] as const,
  messages: (userId: number, chatId: number) =>
    [...chatKeys.detail(userId, chatId), 'messages'] as const,
  messageHistory: (userId: number, chatId: number, limit: number) =>
    [...chatKeys.messages(userId, chatId), { limit }] as const,
};
