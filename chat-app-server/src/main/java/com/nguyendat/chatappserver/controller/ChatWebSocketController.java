package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.MessageDeliveryEvent;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.MessageService;
import com.nguyendat.chatappserver.service.result.SendMessageResult;
import com.nguyendat.chatappserver.websocket.WebSocketPrincipal;
import java.security.Principal;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
      @DestinationVariable Long chatId, SendMessageRequest request, Principal principal) {
    User currentUser = extractUser(principal);

    try {
      validateRequest(request);
      SendMessageResult result = messageService.sendMessage(request, chatId, currentUser);
      sendToCurrentUser(
          principal,
          MessageDeliveryEvent.builder()
              .type(com.nguyendat.chatappserver.realtime.RealtimeEventType.MESSAGE_ACK)
              .chatId(chatId)
              .clientMessageId(request.getClientMessageId())
              .message(result.message())
              .duplicate(!result.created())
              .build());
    } catch (AppException exception) {
      ErrorCode errorCode = exception.getErrorCode();
      sendToCurrentUser(
          principal,
          MessageDeliveryEvent.builder()
              .type(com.nguyendat.chatappserver.realtime.RealtimeEventType.MESSAGE_REJECTED)
              .chatId(chatId)
              .clientMessageId(request.getClientMessageId())
              .code(errorCode.getCode())
              .error(errorCode.getMessage())
              .build());
    }
  }

  private void validateRequest(SendMessageRequest request) {
    UUID clientMessageId = request.getClientMessageId();
    String content = request.getContent();
    if (clientMessageId == null
        || content == null
        || content.isBlank()
        || content.length() > 5000) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
  }

  private User extractUser(Principal principal) {
    if (!(principal instanceof WebSocketPrincipal websocketPrincipal)) {
      throw new IllegalStateException("Invalid WebSocket principal");
    }
    return websocketPrincipal.user();
  }

  private void sendToCurrentUser(Principal principal, MessageDeliveryEvent event) {
    messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/message-events", event);
  }
}
