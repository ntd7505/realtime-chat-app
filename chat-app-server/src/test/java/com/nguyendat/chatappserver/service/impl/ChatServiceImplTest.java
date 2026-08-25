package com.nguyendat.chatappserver.service.impl;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.enums.ChatType;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.ChatMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.ChatMember;
import com.nguyendat.chatappserver.model.Friendship;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.ChatRepository;
import com.nguyendat.chatappserver.repository.FriendshipRepository;
import com.nguyendat.chatappserver.repository.MessageRepository;
import com.nguyendat.chatappserver.repository.UserBlockRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

  @Mock ChatRepository chatRepository;
  @Mock UserRepository userRepository;
  @Mock UserBlockRepository userBlockRepository;
  @Mock FriendshipRepository friendshipRepository;
  @Mock MessageRepository messageRepository;
  @Mock ChatMapper chatMapper;
  @Mock DirectChatCreator directChatCreator;
  @Mock ChatMemberRepository chatMemberRepository;

  @InjectMocks ChatServiceImpl chatService;

  @Nested
  class CreateOrGetDirectChat {

    @Test
    void shouldThrowCannotCreateWithYourself_whenTargetIsCurrentUser() {
      User currentUser = user(1L, "current@example.com", "Current");

      assertAppError(
          () -> chatService.createOrGetDirectChat(currentUser, 1L),
          ErrorCode.CANNOT_CREATE_CHAT_WITH_YOURSELF);

      then(userRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowUserNotFound_whenTargetDoesNotExist() {
      User currentUser = user(1L, "current@example.com", "Current");

      given(userRepository.findById(99L)).willReturn(Optional.empty());

      assertAppError(
          () -> chatService.createOrGetDirectChat(currentUser, 99L), ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void shouldThrowBlockedUser_whenBlockExistsBetweenUsers() {
      User currentUser = user(1L, "current@example.com", "Current");
      User targetUser = user(2L, "target@example.com", "Target");

      given(userRepository.findById(2L)).willReturn(Optional.of(targetUser));
      given(userBlockRepository.existsBlockBetween(1L, 2L)).willReturn(true);

      assertAppError(
          () -> chatService.createOrGetDirectChat(currentUser, 2L),
          ErrorCode.CANNOT_CREATE_CHAT_WITH_BLOCKED_USER);

      then(chatRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldReturnExistingChat_whenDirectChatAlreadyExists() {
      User currentUser = user(1L, "current@example.com", "Current");
      User targetUser = user(2L, "target@example.com", "Target");
      Chat chat = directChat(10L, "1:2");

      ChatResponse expected = ChatResponse.builder().id(10L).type(ChatType.DIRECT).build();

      given(userRepository.findById(2L)).willReturn(Optional.of(targetUser));
      given(userBlockRepository.existsBlockBetween(1L, 2L)).willReturn(false);
      given(chatRepository.findByDirectKey("1:2")).willReturn(Optional.of(chat));
      given(messageRepository.findFirstByChat_IdOrderByIdDesc(10L)).willReturn(Optional.empty());
      given(chatMapper.toChatResponse(chat, targetUser, null)).willReturn(expected);

      ChatResponse actual = chatService.createOrGetDirectChat(currentUser, 2L);

      assertThat(actual).isSameAs(expected);

      then(friendshipRepository).shouldHaveNoInteractions();
      then(directChatCreator).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowUsersAreNotFriends_whenAcceptedFriendshipDoesNotExist() {
      User currentUser = user(1L, "current@example.com", "Current");
      User targetUser = user(2L, "target@example.com", "Target");

      given(userRepository.findById(2L)).willReturn(Optional.of(targetUser));
      given(userBlockRepository.existsBlockBetween(1L, 2L)).willReturn(false);
      given(chatRepository.findByDirectKey("1:2")).willReturn(Optional.empty());
      given(friendshipRepository.findRelationshipBetween(1L, 2L)).willReturn(Optional.empty());

      assertAppError(
          () -> chatService.createOrGetDirectChat(currentUser, 2L),
          ErrorCode.USERS_ARE_NOT_FRIENDS);

      then(directChatCreator).shouldHaveNoInteractions();
    }

    @Test
    void shouldCreateChat_whenUsersAreFriendsAndChatDoesNotExist() {
      User currentUser = user(1L, "current@example.com", "Current");
      User targetUser = user(2L, "target@example.com", "Target");

      Friendship friendship =
          Friendship.builder()
              .requester(currentUser)
              .recipient(targetUser)
              .status(FriendshipStatus.ACCEPTED)
              .build();

      Chat createdChat = directChat(10L, "1:2");

      ChatResponse expected = ChatResponse.builder().id(10L).type(ChatType.DIRECT).build();

      given(userRepository.findById(2L)).willReturn(Optional.of(targetUser));
      given(userBlockRepository.existsBlockBetween(1L, 2L)).willReturn(false);

      // Service kiểm tra directKey hai lần trước khi tạo.
      given(chatRepository.findByDirectKey("1:2")).willReturn(Optional.empty(), Optional.empty());

      given(friendshipRepository.findRelationshipBetween(1L, 2L))
          .willReturn(Optional.of(friendship));
      given(directChatCreator.create(currentUser, targetUser, "1:2")).willReturn(createdChat);
      given(chatMapper.toChatResponse(createdChat, targetUser, null)).willReturn(expected);

      ChatResponse actual = chatService.createOrGetDirectChat(currentUser, 2L);

      assertThat(actual).isSameAs(expected);

      then(directChatCreator).should().create(currentUser, targetUser, "1:2");
    }
  }

  @Nested
  class GetMyChats {

    @Test
    void shouldReturnEmptyPage_whenUserHasNoChats() {
      User currentUser = user(1L, "current@example.com", "Current");

      given(
              chatMemberRepository.findDirectChatsByUserId(
                  org.mockito.ArgumentMatchers.eq(1L), isNull(), isNull(), any(Pageable.class)))
          .willReturn(List.of());

      CursorPageResponse<ChatResponse> result = chatService.getMyChats(currentUser, null, 20);

      assertThat(result.getItems()).isEmpty();
      assertThat(result.isHasNext()).isFalse();
      assertThat(result.getNextCursor()).isNull();

      then(messageRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowInvalidRequest_whenLimitIsTooSmall() {
      User currentUser = user(1L, "current@example.com", "Current");

      assertAppError(() -> chatService.getMyChats(currentUser, null, 0), ErrorCode.INVALID_REQUEST);

      then(chatMemberRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowInvalidRequest_whenLimitIsTooLarge() {
      User currentUser = user(1L, "current@example.com", "Current");

      assertAppError(
          () -> chatService.getMyChats(currentUser, null, 51), ErrorCode.INVALID_REQUEST);
    }
  }

  @Nested
  class GetChatById {

    @Test
    void shouldReturnChat_whenCurrentUserIsMember() {
      User currentUser = user(1L, "current@example.com", "Current");
      User otherUser = user(2L, "other@example.com", "Other");
      Chat chat = directChat(10L, "1:2");

      ChatMember otherMember = new ChatMember();
      otherMember.setChat(chat);
      otherMember.setUser(otherUser);

      ChatResponse expected = ChatResponse.builder().id(10L).type(ChatType.DIRECT).build();

      given(chatMemberRepository.findDirectChatForUser(10L, 1L))
          .willReturn(Optional.of(otherMember));
      given(messageRepository.findFirstByChat_IdOrderByIdDesc(10L)).willReturn(Optional.empty());
      given(chatMapper.toChatResponse(chat, otherUser, null)).willReturn(expected);

      ChatResponse actual = chatService.getChatById(currentUser, 10L);

      assertThat(actual).isSameAs(expected);
    }

    @Test
    void shouldThrowChatNotFound_whenCurrentUserIsNotMember() {
      User currentUser = user(1L, "current@example.com", "Current");

      given(chatMemberRepository.findDirectChatForUser(10L, 1L)).willReturn(Optional.empty());

      assertAppError(() -> chatService.getChatById(currentUser, 10L), ErrorCode.CHAT_NOT_FOUND);
    }
  }

  private Chat directChat(long id, String directKey) {
    Chat chat = new Chat();
    chat.setId(id);
    chat.setType(ChatType.DIRECT);
    chat.setDirectKey(directKey);
    return chat;
  }

  private void assertAppError(Runnable action, ErrorCode expected) {
    assertThatThrownBy(action::run)
        .isInstanceOfSatisfying(
            AppException.class,
            exception -> assertThat(exception.getErrorCode()).isEqualTo(expected));
  }
}
