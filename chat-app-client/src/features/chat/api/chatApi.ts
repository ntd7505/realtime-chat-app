import { apiClient } from '@/lib/http/apiClient';
import type { ApiResponse } from '@/types/api.types';
import type { CursorPage } from '@/types/pagination.types';
import type {
  Chat,
  ChatReadResponse,
  Message,
  MessageSyncResponse,
  SendMessageRequest,
} from '../chat.types';

interface CursorParams {
  cursor?: string | null;
  limit?: number;
}

const MIN_PAGE_LIMIT = 1;
const MAX_PAGE_LIMIT = 50;
const MAX_MESSAGE_LENGTH = 5000;
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const validateLimit = (limit: number) => {
  if (!Number.isInteger(limit) || limit < MIN_PAGE_LIMIT || limit > MAX_PAGE_LIMIT) {
    throw new RangeError(`limit must be an integer between ${MIN_PAGE_LIMIT} and ${MAX_PAGE_LIMIT}`);
  }
};

export const validateSendMessageRequest = ({ clientMessageId, content }: SendMessageRequest) => {
  if (!UUID_PATTERN.test(clientMessageId)) {
    throw new TypeError('clientMessageId must be a valid UUID');
  }
  if (content.trim().length === 0) {
    throw new TypeError('content must not be blank');
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new RangeError(`content must not exceed ${MAX_MESSAGE_LENGTH} characters`);
  }
};

export const chatApi = {
  createOrGetDirectChat: async (userId: number): Promise<Chat> => {
    const response = await apiClient.post<ApiResponse<Chat>>(`/chats/direct/${userId}`);
    return response.data.data;
  },

  getChats: async ({ cursor, limit = 20 }: CursorParams = {}): Promise<CursorPage<Chat>> => {
    validateLimit(limit);
    const response = await apiClient.get<ApiResponse<CursorPage<Chat>>>('/chats', {
      params: { cursor: cursor || undefined, limit },
    });
    return response.data.data;
  },

  getChatById: async (chatId: number): Promise<Chat> => {
    const response = await apiClient.get<ApiResponse<Chat>>(`/chats/${chatId}`);
    return response.data.data;
  },

  getMessages: async (
    chatId: number,
    { cursor, limit = 30 }: CursorParams = {}
  ): Promise<CursorPage<Message>> => {
    validateLimit(limit);
    const response = await apiClient.get<ApiResponse<CursorPage<Message>>>(
      `/chats/${chatId}/messages`,
      { params: { cursor: cursor || undefined, limit } }
    );
    return response.data.data;
  },

  syncMessages: async (
    chatId: number,
    afterMessageId: number,
    limit = 100
  ): Promise<MessageSyncResponse> => {
    if (!Number.isInteger(afterMessageId) || afterMessageId <= 0) {
      throw new RangeError('afterMessageId must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError('limit must be an integer between 1 and 100');
    }
    const response = await apiClient.get<ApiResponse<MessageSyncResponse>>(
      `/chats/${chatId}/messages/sync`,
      { params: { afterMessageId, limit } }
    );
    return response.data.data;
  },

  markAsRead: async (chatId: number, messageId: number): Promise<ChatReadResponse> => {
    const response = await apiClient.patch<ApiResponse<ChatReadResponse>>(
      `/chats/${chatId}/read`,
      { messageId }
    );
    return response.data.data;
  },

  sendMessage: async (chatId: number, request: SendMessageRequest): Promise<Message> => {
    validateSendMessageRequest(request);
    const response = await apiClient.post<ApiResponse<Message>>(
      `/chats/${chatId}/messages`,
      request
    );
    return response.data.data;
  },
};
