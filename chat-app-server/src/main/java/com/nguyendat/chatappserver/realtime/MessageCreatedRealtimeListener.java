package com.nguyendat.chatappserver.realtime;

import com.nguyendat.chatappserver.dto.response.RealtimeEvent;
import com.nguyendat.chatappserver.event.MessageCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class MessageCreatedRealtimeListener {

  private final SimpMessagingTemplate messagingTemplate;
  private final UserRealtimePublisher userRealtimePublisher;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handle(MessageCreatedEvent event) {
    try {
      messagingTemplate.convertAndSend("/topic/chats/" + event.chatId(), event.message());

      RealtimeEvent<?> chatUpdated =
          RealtimeEvent.of(RealtimeEventType.CHAT_UPDATED, event.chatId(), event.message());

      userRealtimePublisher.sendToUser(event.senderId(), chatUpdated);
      userRealtimePublisher.sendToUser(event.recipientId(), chatUpdated);
    } catch (RuntimeException exception) {
      log.error(
          "Failed to publish realtime event for message {}", event.message().getId(), exception);
    }
  }
}
