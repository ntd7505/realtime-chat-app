package com.nguyendat.chatappserver.realtime;

import com.nguyendat.chatappserver.dto.response.ChatReadPayload;
import com.nguyendat.chatappserver.dto.response.RealtimeEvent;
import com.nguyendat.chatappserver.event.ChatReadEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatReadRealtimeListener {

  private final UserRealtimePublisher userRealtimePublisher;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handle(ChatReadEvent event) {
    ChatReadPayload payload = new ChatReadPayload(event.readerId(), event.lastReadMessageId());

    try {
      userRealtimePublisher.sendToUser(
          event.readerId(),
          RealtimeEvent.of(RealtimeEventType.READ_UPDATED, event.chatId(), payload));
      userRealtimePublisher.sendToUser(
          event.otherUserId(),
          RealtimeEvent.of(RealtimeEventType.MESSAGE_READ, event.chatId(), payload));
    } catch (RuntimeException exception) {
      log.error(
          "Failed to publish read event for chat {} and reader {}",
          event.chatId(),
          event.readerId(),
          exception);
    }
  }
}
