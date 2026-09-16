package com.nguyendat.chatappserver.realtime;

import com.nguyendat.chatappserver.dto.response.RealtimeEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserRealtimePublisher {

  private static final String USER_EVENT_DESTINATION = "/queue/events";

  private final SimpMessagingTemplate messagingTemplate;

  public void sendToUser(Long userId, RealtimeEvent<?> event) {
    messagingTemplate.convertAndSendToUser(userId.toString(), USER_EVENT_DESTINATION, event);
  }
}
