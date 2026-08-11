package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.model.User;

public interface ChatService {

  ChatResponse createOrGetDirectChat(User currentUser, Long targetUserId);
}
