import type { UserSummary } from '@/features/users/user.types';

export type ChatType = 'DIRECT';
export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface Message {
  id: number;
  clientMessageId: string;
  sender: UserSummary;
  content: string;
  createdAt: string;
  status?: MessageStatus;
}

export interface Chat {
  id: number;
  type: ChatType;
  otherUser: UserSummary;
  lastMessage: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
  unreadCount: number;
}

export interface SendMessageRequest {
  clientMessageId: string;
  content: string;
}

export interface MessageDeliveryEvent {
  type: 'message.ack' | 'message.rejected';
  chatId: number;
  clientMessageId: string;
  message?: Message;
  duplicate: boolean;
  code?: number;
  error?: string;
}

export interface ChatReadResponse {
  chatId: number;
  userId: number;
  lastReadMessageId: number | null;
}

export interface MessageSyncResponse {
  items: Message[];
  nextAfterMessageId: number | null;
  hasMore: boolean;
}

export interface RealtimeEvent<T = unknown> {
  eventId: string;
  type:
    | 'chat.updated'
    | 'friendship.requested'
    | 'friendship.accepted'
    | 'friendship.deleted'
    | 'read.updated'
    | 'message.read';
  chatId: number | null;
  payload: T;
  occurredAt: string;
}
