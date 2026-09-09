package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.dto.response.MessageSyncResponse;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.result.SendMessageResult;

public interface MessageService {
  CursorPageResponse<MessageResponse> getMessageHistory(
      User currentUser, Long chatId, String cursor, int limit);

  SendMessageResult sendMessage(SendMessageRequest request, Long chatId, User currentUser);

  MessageSyncResponse getMessagesAfter(
      User currentUser, Long chatId, Long afterMessageId, int limit);
}
