package com.nguyendat.chatappserver.service.impl;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.dto.response.MessageSyncResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.MessageMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.ChatMember;
import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.MessageRepository;
import com.nguyendat.chatappserver.repository.UserBlockRepository;
import com.nguyendat.chatappserver.service.result.SendMessageResult;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class MessageServiceImplTest {

  @Mock ChatMemberRepository chatMemberRepository;
  @Mock MessageRepository messageRepository;
  @Mock MessageMapper messageMapper;
  @Mock MessageCreator messageCreator;
  @Mock UserBlockRepository userBlockRepository;

  @InjectMocks MessageServiceImpl messageService;

  @Nested
  class SendMessage {

    @Test
    void shouldThrowChatNotFound_whenSenderIsNotMember() {
      User sender = user(1L, "sender@example.com", "Sender");
      SendMessageRequest request = sendRequest();

      given(chatMemberRepository.findDirectChatForUser(10L, 1L)).willReturn(Optional.empty());

      assertAppError(
          () -> messageService.sendMessage(request, 10L, sender), ErrorCode.CHAT_NOT_FOUND);

      then(messageRepository)
          .should()
          .findMessageBySender_IdAndClientMessageId(1L, request.getClientMessageId());
      then(messageCreator).shouldHaveNoInteractions();
      then(userBlockRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowCannotMessageBlockedUser_whenBlockExistsBetweenChatMembers() {
      User sender = user(1L, "sender@example.com", "Sender");
      User recipient = user(2L, "recipient@example.com", "Recipient");
      SendMessageRequest request = sendRequest();

      given(chatMemberRepository.findDirectChatForUser(10L, 1L))
          .willReturn(Optional.of(otherMember(recipient)));
      given(userBlockRepository.existsBlockBetween(1L, 2L)).willReturn(true);

      assertAppError(
          () -> messageService.sendMessage(request, 10L, sender),
          ErrorCode.CANNOT_MESSAGE_BLOCKED_USER);

      then(messageRepository)
          .should()
          .findMessageBySender_IdAndClientMessageId(1L, request.getClientMessageId());
      then(messageCreator).shouldHaveNoInteractions();
    }

    @Test
    void shouldReturnExistingMessage_whenClientMessageIdWasAlreadyUsed() {
      User sender = user(1L, "sender@example.com", "Sender");
      SendMessageRequest request = sendRequest();

      Message existing = new Message();
      Chat chat = new Chat();
      chat.setId(10L);
      existing.setId(100L);
      existing.setChat(chat);
      existing.setSender(sender);
      existing.setClientMessageId(request.getClientMessageId());
      existing.setContent(request.getContent());

      MessageResponse expected =
          MessageResponse.builder()
              .id(100L)
              .clientMessageId(request.getClientMessageId())
              .content(request.getContent())
              .build();

      given(
              messageRepository.findMessageBySender_IdAndClientMessageId(
                  1L, request.getClientMessageId()))
          .willReturn(Optional.of(existing));
      given(messageMapper.toMessageResponse(existing)).willReturn(expected);

      SendMessageResult actual = messageService.sendMessage(request, 10L, sender);

      assertThat(actual.message()).isSameAs(expected);
      assertThat(actual.created()).isFalse();
      then(chatMemberRepository).shouldHaveNoInteractions();
      then(userBlockRepository).shouldHaveNoInteractions();
      then(messageCreator).shouldHaveNoInteractions();
    }

    @Test
    void shouldDelegateToMessageCreator_whenMessageIsNew() {
      User sender = user(1L, "sender@example.com", "Sender");
      User recipient = user(2L, "recipient@example.com", "Recipient");
      SendMessageRequest request = sendRequest();

      MessageResponse expected =
          MessageResponse.builder()
              .id(100L)
              .clientMessageId(request.getClientMessageId())
              .content(request.getContent())
              .build();

      given(chatMemberRepository.findDirectChatForUser(10L, 1L))
          .willReturn(Optional.of(otherMember(recipient)));
      given(userBlockRepository.existsBlockBetween(1L, 2L)).willReturn(false);
      given(
              messageRepository.findMessageBySender_IdAndClientMessageId(
                  1L, request.getClientMessageId()))
          .willReturn(Optional.empty());
      given(messageCreator.create(request, 10L, sender, 2L)).willReturn(expected);

      SendMessageResult actual = messageService.sendMessage(request, 10L, sender);

      assertThat(actual.message()).isSameAs(expected);
      assertThat(actual.created()).isTrue();
      then(messageCreator).should().create(request, 10L, sender, 2L);
    }

    @Test
    void shouldRejectRetry_whenClientMessageIdIsReusedWithDifferentContent() {
      User sender = user(1L, "sender@example.com", "Sender");
      User recipient = user(2L, "recipient@example.com", "Recipient");
      SendMessageRequest request = sendRequest();
      Chat chat = new Chat();
      chat.setId(10L);
      Message existing = new Message();
      existing.setChat(chat);
      existing.setContent("Different content");

      given(
              messageRepository.findMessageBySender_IdAndClientMessageId(
                  1L, request.getClientMessageId()))
          .willReturn(Optional.of(existing));

      assertAppError(
          () -> messageService.sendMessage(request, 10L, sender), ErrorCode.INVALID_REQUEST);
      then(messageCreator).shouldHaveNoInteractions();
    }
  }

  @Nested
  class GetMessagesAfter {

    @Test
    void shouldReturnOnlyMessagesAfterTheLastSeenMessage() {
      User currentUser = user(1L, "user@example.com", "User");
      Message first = new Message();
      first.setId(101L);
      Message second = new Message();
      second.setId(102L);
      MessageResponse firstResponse = MessageResponse.builder().id(101L).build();
      MessageResponse secondResponse = MessageResponse.builder().id(102L).build();

      given(chatMemberRepository.existsByChat_IdAndUser_Id(10L, 1L)).willReturn(true);
      given(messageRepository.existsByIdAndChat_Id(100L, 10L)).willReturn(true);
      given(
              messageRepository.findMessagesAfter(
                  org.mockito.ArgumentMatchers.eq(10L),
                  org.mockito.ArgumentMatchers.eq(100L),
                  any(Pageable.class)))
          .willReturn(List.of(first, second));
      given(messageMapper.toMessageResponse(first)).willReturn(firstResponse);
      given(messageMapper.toMessageResponse(second)).willReturn(secondResponse);

      MessageSyncResponse result = messageService.getMessagesAfter(currentUser, 10L, 100L, 10);

      assertThat(result.items()).containsExactly(firstResponse, secondResponse);
      assertThat(result.hasMore()).isFalse();
      assertThat(result.nextAfterMessageId()).isNull();
    }
  }

  @Nested
  class GetMessageHistory {

    @Test
    void shouldThrowChatNotFound_whenCurrentUserIsNotMember() {
      User currentUser = user(1L, "user@example.com", "User");

      given(chatMemberRepository.existsByChat_IdAndUser_Id(10L, 1L)).willReturn(false);

      assertAppError(
          () -> messageService.getMessageHistory(currentUser, 10L, null, 30),
          ErrorCode.CHAT_NOT_FOUND);

      then(messageRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldReturnEmptyPage_whenChatHasNoMessages() {
      User currentUser = user(1L, "user@example.com", "User");

      given(chatMemberRepository.existsByChat_IdAndUser_Id(10L, 1L)).willReturn(true);
      given(
              messageRepository.findMessageHistory(
                  org.mockito.ArgumentMatchers.eq(10L), isNull(), any(Pageable.class)))
          .willReturn(List.of());

      CursorPageResponse<MessageResponse> result =
          messageService.getMessageHistory(currentUser, 10L, null, 30);

      assertThat(result.getItems()).isEmpty();
      assertThat(result.isHasNext()).isFalse();
      assertThat(result.getNextCursor()).isNull();
    }

    @Test
    void shouldThrowInvalidRequest_whenLimitIsOutsideAllowedRange() {
      User currentUser = user(1L, "user@example.com", "User");

      assertAppError(
          () -> messageService.getMessageHistory(currentUser, 10L, null, 0),
          ErrorCode.INVALID_REQUEST);

      assertAppError(
          () -> messageService.getMessageHistory(currentUser, 10L, null, 51),
          ErrorCode.INVALID_REQUEST);

      then(chatMemberRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowInvalidRequest_whenCursorIsInvalid() {
      User currentUser = user(1L, "user@example.com", "User");

      given(chatMemberRepository.existsByChat_IdAndUser_Id(10L, 1L)).willReturn(true);

      assertAppError(
          () -> messageService.getMessageHistory(currentUser, 10L, "not-valid-base64!!!", 30),
          ErrorCode.INVALID_REQUEST);

      then(messageRepository).shouldHaveNoInteractions();
    }
  }

  private SendMessageRequest sendRequest() {
    SendMessageRequest request = new SendMessageRequest();
    request.setClientMessageId(UUID.randomUUID());
    request.setContent("Hello");
    return request;
  }

  private ChatMember otherMember(User recipient) {
    ChatMember member = new ChatMember();
    member.setUser(recipient);
    return member;
  }

  private void assertAppError(Runnable action, ErrorCode expected) {
    assertThatThrownBy(action::run)
        .isInstanceOfSatisfying(
            AppException.class,
            exception -> assertThat(exception.getErrorCode()).isEqualTo(expected));
  }
}
