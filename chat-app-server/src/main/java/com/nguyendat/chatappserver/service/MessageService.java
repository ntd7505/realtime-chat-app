package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.model.User;

public interface MessageService {
  CursorPageResponse<MessageResponse> getMessageHistory(
      User currentUser, Long chatId, String cursor, int limit);

  MessageResponse sendMessage(SendMessageRequest request, Long chatId, User currentUser);
}
