package com.nguyendat.chatappserver.websocket;

import static com.nguyendat.chatappserver.realtime.RealtimeEventType.MESSAGE_ACK;
import static com.nguyendat.chatappserver.realtime.RealtimeEventType.MESSAGE_REJECTED;
import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.nguyendat.chatappserver.controller.ChatWebSocketController;
import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.MessageDeliveryEvent;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.MessageService;
import com.nguyendat.chatappserver.service.result.SendMessageResult;
import java.security.Principal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

  @Mock MessageService messageService;
  @Mock SimpMessagingTemplate messagingTemplate;

  @InjectMocks ChatWebSocketController controller;

  @Test
  void sendMessage_shouldAcknowledgePersistedMessage() {
    User currentUser = user(1L, "user@example.com", "User");
    WebSocketPrincipal principal = new WebSocketPrincipal(currentUser);

    SendMessageRequest request = new SendMessageRequest();
    request.setClientMessageId(UUID.randomUUID());
    request.setContent("Hello");

    MessageResponse response =
        MessageResponse.builder()
            .id(100L)
            .clientMessageId(request.getClientMessageId())
            .content("Hello")
            .build();

    given(messageService.sendMessage(request, 10L, currentUser))
        .willReturn(new SendMessageResult(response, true));

    controller.sendMessage(10L, request, principal);

    then(messageService).should().sendMessage(request, 10L, currentUser);

    ArgumentCaptor<MessageDeliveryEvent> eventCaptor =
        ArgumentCaptor.forClass(MessageDeliveryEvent.class);
    then(messagingTemplate)
        .should()
        .convertAndSendToUser(
            org.mockito.ArgumentMatchers.eq("1"),
            org.mockito.ArgumentMatchers.eq("/queue/message-events"),
            eventCaptor.capture());
    assertThat(eventCaptor.getValue().getType()).isEqualTo(MESSAGE_ACK);
    assertThat(eventCaptor.getValue().getMessage()).isSameAs(response);
    assertThat(eventCaptor.getValue().isDuplicate()).isFalse();
  }

  @Test
  void sendMessage_shouldRejectUnauthenticatedPrincipal() {
    Principal principal = () -> "anonymous";

    SendMessageRequest request = new SendMessageRequest();
    request.setClientMessageId(UUID.randomUUID());
    request.setContent("Hello");

    assertThatThrownBy(() -> controller.sendMessage(10L, request, principal))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Invalid WebSocket principal");

    then(messageService).shouldHaveNoInteractions();
    then(messagingTemplate).shouldHaveNoInteractions();
  }

  @Test
  void sendMessage_shouldReturnStructuredBusinessError() {
    User currentUser = user(1L, "user@example.com", "User");
    WebSocketPrincipal principal = new WebSocketPrincipal(currentUser);

    SendMessageRequest request = new SendMessageRequest();
    request.setClientMessageId(UUID.randomUUID());
    request.setContent("Hello");

    given(messageService.sendMessage(request, 10L, currentUser))
        .willThrow(new AppException(ErrorCode.CANNOT_MESSAGE_BLOCKED_USER));

    controller.sendMessage(10L, request, principal);

    ArgumentCaptor<MessageDeliveryEvent> eventCaptor =
        ArgumentCaptor.forClass(MessageDeliveryEvent.class);
    then(messagingTemplate)
        .should()
        .convertAndSendToUser(
            org.mockito.ArgumentMatchers.eq("1"),
            org.mockito.ArgumentMatchers.eq("/queue/message-events"),
            eventCaptor.capture());
    assertThat(eventCaptor.getValue().getType()).isEqualTo(MESSAGE_REJECTED);
    assertThat(eventCaptor.getValue().getClientMessageId()).isEqualTo(request.getClientMessageId());
    assertThat(eventCaptor.getValue().getCode())
        .isEqualTo(ErrorCode.CANNOT_MESSAGE_BLOCKED_USER.getCode());
  }

  @Test
  void sendMessage_shouldReturnCorrelatedValidationError() {
    User currentUser = user(1L, "user@example.com", "User");
    WebSocketPrincipal principal = new WebSocketPrincipal(currentUser);
    SendMessageRequest request = new SendMessageRequest();
    request.setClientMessageId(UUID.randomUUID());
    request.setContent("   ");

    controller.sendMessage(10L, request, principal);

    ArgumentCaptor<MessageDeliveryEvent> eventCaptor =
        ArgumentCaptor.forClass(MessageDeliveryEvent.class);
    then(messagingTemplate)
        .should()
        .convertAndSendToUser(
            org.mockito.ArgumentMatchers.eq("1"),
            org.mockito.ArgumentMatchers.eq("/queue/message-events"),
            eventCaptor.capture());
    assertThat(eventCaptor.getValue().getType()).isEqualTo(MESSAGE_REJECTED);
    assertThat(eventCaptor.getValue().getClientMessageId()).isEqualTo(request.getClientMessageId());
    assertThat(eventCaptor.getValue().getCode()).isEqualTo(ErrorCode.INVALID_REQUEST.getCode());
    then(messageService).shouldHaveNoInteractions();
  }
}
