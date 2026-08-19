package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.MessageService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Validated
public class ChatWebSocketController {

  MessageService messageService;
  SimpMessagingTemplate messagingTemplate;

  @MessageMapping("/chats/{chatId}/messages")
  public void sendMessage(
      @DestinationVariable Long chatId, @Valid SendMessageRequest request, Principal principal) {
    User currentUser = extractUser(principal);

    MessageResponse response = messageService.sendMessage(request, chatId, currentUser);

    messagingTemplate.convertAndSend("/topic/chats/" + chatId, response);
  }

  private User extractUser(Principal principal) {
    if (!(principal instanceof Authentication authentication)) {
      throw new IllegalStateException("WebSocket principal is not authenticated");
    }

    if (!(authentication.getPrincipal() instanceof User user)) {
      throw new IllegalStateException("Invalid WebSocket principal");
    }

    return user;
  }
}
