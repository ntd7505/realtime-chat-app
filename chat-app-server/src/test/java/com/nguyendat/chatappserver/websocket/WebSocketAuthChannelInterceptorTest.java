package com.nguyendat.chatappserver.websocket;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nguyendat.chatappserver.config.WebSocketAuthChannelInterceptor;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.impl.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthChannelInterceptorTest {

  @Mock JwtService jwtService;
  @Mock UserRepository userRepository;
  @Mock ChatMemberRepository chatMemberRepository;

  @InjectMocks WebSocketAuthChannelInterceptor interceptor;

  @Test
  void shouldAllowCurrentUsersPrivateEventDestinations() {
    assertThatCode(() -> interceptor.preSend(subscription("/user/queue/events"), null))
        .doesNotThrowAnyException();
    assertThatCode(() -> interceptor.preSend(subscription("/user/queue/message-events"), null))
        .doesNotThrowAnyException();
  }

  @Test
  void shouldRejectDestinationThatAttemptsToNameAnotherUser() {
    assertThatThrownBy(() -> interceptor.preSend(subscription("/user/2/queue/events"), null))
        .isInstanceOf(MessageDeliveryException.class)
        .hasMessage("Invalid subscription destination");
  }

  private Message<byte[]> subscription(String destination) {
    User currentUser = user(1L, "user@example.com", "User");
    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    accessor.setSessionId("session-1");
    accessor.setDestination(destination);
    accessor.setUser(new WebSocketPrincipal(currentUser));
    return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
  }
}
