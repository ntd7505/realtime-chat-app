package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.model.User;

public interface ChatService {

  ChatResponse createOrGetDirectChat(User currentUser, Long targetUserId);

  CursorPageResponse<ChatResponse> getMyChats(User currentUser, String cursor, int limit);

  ChatResponse getChatById(User currentUser, Long chatId);
}
