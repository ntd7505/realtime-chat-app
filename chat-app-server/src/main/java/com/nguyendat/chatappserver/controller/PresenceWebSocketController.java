package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.service.PresenceService;
import com.nguyendat.chatappserver.websocket.WebSocketPrincipal;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PresenceWebSocketController {

  private final PresenceService presenceService;

  @MessageMapping("/presence/heartbeat")
  public void heartbeat(Principal principal) {
    WebSocketPrincipal websocketPrincipal = extractPrincipal(principal);

    presenceService.touch(websocketPrincipal.user().getId());
  }

  private WebSocketPrincipal extractPrincipal(Principal principal) {

    if (!(principal instanceof WebSocketPrincipal websocketPrincipal)) {
      throw new IllegalStateException("Invalid WebSocket principal");
    }

    return websocketPrincipal;
  }
}
