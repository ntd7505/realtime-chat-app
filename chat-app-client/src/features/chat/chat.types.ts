import type { UserSummary } from '@/features/users/user.types';

export type ChatType = 'DIRECT';

export interface Message {
  id: number;
  clientMessageId: string;
  sender: UserSummary;
  content: string;
  createdAt: string;
}

export interface Chat {
  id: number;
  type: ChatType;
  otherUser: UserSummary;
  lastMessage: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  clientMessageId: string;
  content: string;
}
