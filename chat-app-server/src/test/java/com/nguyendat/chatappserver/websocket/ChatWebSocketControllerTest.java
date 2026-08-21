package com.nguyendat.chatappserver.websocket;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.nguyendat.chatappserver.controller.ChatWebSocketController;
import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.MessageService;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

    @Mock
    MessageService messageService;
    @Mock
    SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    ChatWebSocketController controller;

    @Test
    void sendMessage_shouldSaveAndBroadcastMessage() {
        User currentUser = user(1L, "user@example.com", "User");

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        currentUser, null, List.of());

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
                .willReturn(response);

        controller.sendMessage(10L, request, authentication);

        then(messageService)
                .should()
                .sendMessage(request, 10L, currentUser);

        then(messagingTemplate)
                .should()
                .convertAndSend("/topic/chats/10", response);
    }

    @Test
    void sendMessage_shouldRejectUnauthenticatedPrincipal() {
        Principal principal = () -> "anonymous";

        SendMessageRequest request = new SendMessageRequest();
        request.setClientMessageId(UUID.randomUUID());
        request.setContent("Hello");

        assertThatThrownBy(
                () -> controller.sendMessage(10L, request, principal))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("WebSocket principal is not authenticated");

        then(messageService).shouldHaveNoInteractions();
        then(messagingTemplate).shouldHaveNoInteractions();
    }

    @Test
    void sendMessage_shouldRejectAuthenticationWithInvalidPrincipal() {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        "not-domain-user", null, List.of());

        SendMessageRequest request = new SendMessageRequest();
        request.setClientMessageId(UUID.randomUUID());
        request.setContent("Hello");

        assertThatThrownBy(
                () -> controller.sendMessage(10L, request, authentication))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Invalid WebSocket principal");

        then(messageService).shouldHaveNoInteractions();
        then(messagingTemplate).shouldHaveNoInteractions();
    }
}