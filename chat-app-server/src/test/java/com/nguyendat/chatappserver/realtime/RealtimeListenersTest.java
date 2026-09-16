package com.nguyendat.chatappserver.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.then;

import com.nguyendat.chatappserver.dto.response.FriendshipChangedPayload;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.dto.response.RealtimeEvent;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.event.ChatReadEvent;
import com.nguyendat.chatappserver.event.FriendshipChangedEvent;
import com.nguyendat.chatappserver.event.MessageCreatedEvent;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class RealtimeListenersTest {

  @Mock SimpMessagingTemplate messagingTemplate;
  @Mock UserRealtimePublisher userRealtimePublisher;

  @InjectMocks MessageCreatedRealtimeListener messageListener;
  @InjectMocks FriendshipRealtimeListener friendshipListener;
  @InjectMocks ChatReadRealtimeListener chatReadListener;

  @Test
  void messageCreatedShouldUpdateTopicAndBothUsers() {
    MessageResponse message = MessageResponse.builder().id(100L).build();

    messageListener.handle(new MessageCreatedEvent(10L, 1L, 2L, message));

    then(messagingTemplate).should().convertAndSend("/topic/chats/10", message);
    then(userRealtimePublisher).should().sendToUser(eq(1L), eventWithType("chat.updated"));
    then(userRealtimePublisher).should().sendToUser(eq(2L), eventWithType("chat.updated"));
  }

  @Test
  void friendshipChangedShouldNotifyEveryAffectedUser() {
    FriendshipChangedPayload payload =
        new FriendshipChangedPayload(5L, 1L, 2L, FriendshipStatus.PENDING);

    friendshipListener.handle(
        new FriendshipChangedEvent("friendship.requested", Set.of(1L, 2L), payload));

    ArgumentCaptor<RealtimeEvent<?>> eventCaptor = realtimeEventCaptor();
    then(userRealtimePublisher).should().sendToUser(eq(1L), eventCaptor.capture());
    then(userRealtimePublisher).should().sendToUser(eq(2L), eventCaptor.capture());
    assertThat(eventCaptor.getAllValues())
        .extracting(RealtimeEvent::getType)
        .containsOnly("friendship.requested");
  }

  @Test
  void readChangedShouldNotifyReaderAndOtherMemberWithDifferentEventTypes() {
    chatReadListener.handle(new ChatReadEvent(10L, 1L, 2L, 100L));

    ArgumentCaptor<RealtimeEvent<?>> eventCaptor = realtimeEventCaptor();
    then(userRealtimePublisher).should().sendToUser(eq(1L), eventCaptor.capture());
    then(userRealtimePublisher).should().sendToUser(eq(2L), eventCaptor.capture());
    assertThat(eventCaptor.getAllValues())
        .extracting(RealtimeEvent::getType)
        .containsExactly("read.updated", "message.read");
  }

  private RealtimeEvent<?> eventWithType(String type) {
    return org.mockito.ArgumentMatchers.argThat(event -> type.equals(event.getType()));
  }

  @SuppressWarnings({"unchecked", "rawtypes"})
  private ArgumentCaptor<RealtimeEvent<?>> realtimeEventCaptor() {
    return (ArgumentCaptor) ArgumentCaptor.forClass(RealtimeEvent.class);
  }
}
