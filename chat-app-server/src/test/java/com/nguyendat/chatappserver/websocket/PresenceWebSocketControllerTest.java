package com.nguyendat.chatappserver.websocket;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

import com.nguyendat.chatappserver.controller.PresenceWebSocketController;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.PresenceService;
import java.security.Principal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PresenceWebSocketControllerTest {

  @Mock PresenceService presenceService;

  PresenceWebSocketController controller;

  @BeforeEach
  void setUp() {
    controller = new PresenceWebSocketController(presenceService);
  }

  @Test
  void heartbeatShouldTouchCurrentUserPresence() {
    User currentUser = user(15L, "user@example.com", "User");

    WebSocketPrincipal principal = new WebSocketPrincipal(currentUser);

    controller.heartbeat(principal);

    verify(presenceService).touch(15L);
  }

  @Test
  void heartbeatShouldRejectInvalidPrincipal() {
    Principal invalidPrincipal = () -> "15";

    assertThatThrownBy(() -> controller.heartbeat(invalidPrincipal))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("Invalid WebSocket principal");
  }
}
