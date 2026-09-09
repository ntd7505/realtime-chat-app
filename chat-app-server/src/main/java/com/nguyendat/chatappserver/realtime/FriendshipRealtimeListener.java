package com.nguyendat.chatappserver.realtime;

import com.nguyendat.chatappserver.dto.response.RealtimeEvent;
import com.nguyendat.chatappserver.event.FriendshipChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class FriendshipRealtimeListener {

  private final UserRealtimePublisher userRealtimePublisher;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handle(FriendshipChangedEvent event) {
    RealtimeEvent<?> realtimeEvent = RealtimeEvent.of(event.type(), null, event.payload());

    event
        .audienceUserIds()
        .forEach(
            userId -> {
              try {
                userRealtimePublisher.sendToUser(userId, realtimeEvent);
              } catch (RuntimeException exception) {
                log.error("Failed to publish {} event to user {}", event.type(), userId, exception);
              }
            });
  }
}
