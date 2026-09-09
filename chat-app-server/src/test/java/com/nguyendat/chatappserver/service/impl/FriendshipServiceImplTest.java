package com.nguyendat.chatappserver.service.impl;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static com.nguyendat.chatappserver.support.TestFixtures.userSummary;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.nguyendat.chatappserver.dto.response.FriendshipResponse;
import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.FriendshipMapper;
import com.nguyendat.chatappserver.mapper.UserMapper;
import com.nguyendat.chatappserver.model.Friendship;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.FriendshipRepository;
import com.nguyendat.chatappserver.repository.UserBlockRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class FriendshipServiceImplTest {

  @Mock UserBlockRepository userBlockRepository;
  @Mock UserRepository userRepository;
  @Mock UserMapper userMapper;
  @Mock FriendshipRepository friendshipRepository;
  @Mock FriendshipMapper friendshipMapper;
  @Mock ApplicationEventPublisher eventPublisher;

  @InjectMocks FriendshipServiceImpl friendshipService;

  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  @Nested
  class FriendRequest {

    @Test
    void shouldSavePendingFriendship_whenRequestIsValid() {
      User currentUser = user(1L, "current@example.com", "Current");
      User recipient = user(2L, "recipient@example.com", "Recipient");
      authenticate(currentUser);

      FriendshipResponse expected =
          FriendshipResponse.builder()
              .requesterId(1L)
              .recipientId(2L)
              .status(FriendshipStatus.PENDING)
              .build();

      given(userRepository.findById(2L)).willReturn(Optional.of(recipient));
      given(friendshipRepository.findRelationshipBetween(1L, 2L)).willReturn(Optional.empty());
      given(userBlockRepository.existsByBlockerIdAndBlockedUserId(2L, 1L)).willReturn(false);
      given(userBlockRepository.existsByBlockerIdAndBlockedUserId(1L, 2L)).willReturn(false);
      given(friendshipRepository.save(any(Friendship.class)))
          .willAnswer(invocation -> invocation.getArgument(0));
      given(friendshipMapper.toFriendshipResponse(any(Friendship.class), eq(1L)))
          .willReturn(expected);

      FriendshipResponse actual = friendshipService.friendRequest(2L);

      assertThat(actual).isSameAs(expected);

      ArgumentCaptor<Friendship> captor = ArgumentCaptor.forClass(Friendship.class);

      then(friendshipRepository).should().save(captor.capture());

      Friendship saved = captor.getValue();

      assertThat(saved.getRequester()).isSameAs(currentUser);
      assertThat(saved.getRecipient()).isSameAs(recipient);
      assertThat(saved.getStatus()).isEqualTo(FriendshipStatus.PENDING);
    }

    @Test
    void shouldThrowCannotSendToYourself_whenTargetIsCurrentUser() {
      User currentUser = user(1L, "current@example.com", "Current");
      authenticate(currentUser);

      assertAppError(
          () -> friendshipService.friendRequest(1L),
          ErrorCode.CANNOT_SEND_FRIEND_REQUEST_TO_YOURSELF);

      then(userRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowUserNotFound_whenRecipientDoesNotExist() {
      User currentUser = user(1L, "current@example.com", "Current");
      authenticate(currentUser);

      given(userRepository.findById(99L)).willReturn(Optional.empty());

      assertAppError(() -> friendshipService.friendRequest(99L), ErrorCode.USER_NOT_FOUND);

      then(friendshipRepository).should(never()).save(any());
    }

    @Test
    void shouldThrowAlreadyFriends_whenAcceptedRelationshipExists() {
      User currentUser = user(1L, "current@example.com", "Current");
      User recipient = user(2L, "recipient@example.com", "Recipient");
      authenticate(currentUser);

      Friendship friendship =
          Friendship.builder()
              .requester(currentUser)
              .recipient(recipient)
              .status(FriendshipStatus.ACCEPTED)
              .build();

      given(userRepository.findById(2L)).willReturn(Optional.of(recipient));
      given(friendshipRepository.findRelationshipBetween(1L, 2L))
          .willReturn(Optional.of(friendship));

      assertAppError(() -> friendshipService.friendRequest(2L), ErrorCode.ALREADY_FRIENDS);

      then(friendshipRepository).should(never()).save(any());
    }
  }

  @Nested
  class AcceptFriendRequest {

    @Test
    void shouldChangeStatusToAccepted_whenRequestExists() {
      User requester = user(1L, "requester@example.com", "Requester");
      User currentUser = user(2L, "current@example.com", "Current");
      authenticate(currentUser);

      Friendship friendship =
          Friendship.builder()
              .requester(requester)
              .recipient(currentUser)
              .status(FriendshipStatus.PENDING)
              .build();

      FriendshipResponse expected =
          FriendshipResponse.builder()
              .requesterId(1L)
              .recipientId(2L)
              .status(FriendshipStatus.ACCEPTED)
              .build();

      given(friendshipRepository.findFriendshipByRequester_IdAndRecipient_Id(1L, 2L))
          .willReturn(Optional.of(friendship));
      given(friendshipRepository.save(friendship)).willReturn(friendship);
      given(friendshipMapper.toFriendshipResponse(friendship, 2L)).willReturn(expected);

      FriendshipResponse actual = friendshipService.acceptFriendRequest(1L);

      assertThat(actual).isSameAs(expected);
      assertThat(friendship.getStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
    }

    @Test
    void shouldThrowRequestNotFound_whenRequestDoesNotExist() {
      User currentUser = user(2L, "current@example.com", "Current");
      authenticate(currentUser);

      given(friendshipRepository.findFriendshipByRequester_IdAndRecipient_Id(1L, 2L))
          .willReturn(Optional.empty());

      assertAppError(
          () -> friendshipService.acceptFriendRequest(1L), ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }
  }

  @Nested
  class GetFriendList {

    @Test
    void shouldReturnOtherUserFromEachFriendship() {
      User currentUser = user(1L, "current@example.com", "Current");
      User alice = user(2L, "alice@example.com", "Alice");
      User bob = user(3L, "bob@example.com", "Bob");

      Friendship currentUserRequested =
          Friendship.builder()
              .requester(currentUser)
              .recipient(alice)
              .status(FriendshipStatus.ACCEPTED)
              .build();

      Friendship currentUserReceived =
          Friendship.builder()
              .requester(bob)
              .recipient(currentUser)
              .status(FriendshipStatus.ACCEPTED)
              .build();

      UserSummaryResponse aliceResponse = userSummary(2L, "Alice");
      UserSummaryResponse bobResponse = userSummary(3L, "Bob");

      given(friendshipRepository.findAllFriendshipsOfUser(1L, FriendshipStatus.ACCEPTED))
          .willReturn(List.of(currentUserRequested, currentUserReceived));
      given(userMapper.toUserSummaryResponse(alice)).willReturn(aliceResponse);
      given(userMapper.toUserSummaryResponse(bob)).willReturn(bobResponse);

      List<UserSummaryResponse> actual = friendshipService.getFriendList(currentUser);

      assertThat(actual).containsExactly(aliceResponse, bobResponse);
    }
  }

  @Nested
  class GetSentFriendRequests {

    @Test
    void shouldReturnRecipientsOfPendingRequests() {
      User currentUser = user(1L, "current@example.com", "Current");
      User recipient = user(2L, "recipient@example.com", "Recipient");
      Friendship friendship =
          Friendship.builder()
              .requester(currentUser)
              .recipient(recipient)
              .status(FriendshipStatus.PENDING)
              .build();
      UserSummaryResponse expected = userSummary(2L, "Recipient");

      given(friendshipRepository.findAllSentRequests(1L, FriendshipStatus.PENDING))
          .willReturn(List.of(friendship));
      given(userMapper.toUserSummaryResponse(recipient)).willReturn(expected);

      assertThat(friendshipService.getSentFriendRequests(currentUser)).containsExactly(expected);
    }
  }

  private void authenticate(User user) {
    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(user, null, List.of());

    SecurityContextHolder.getContext().setAuthentication(authentication);
  }

  private void assertAppError(Runnable action, ErrorCode expected) {
    assertThatThrownBy(action::run)
        .isInstanceOfSatisfying(
            AppException.class,
            exception -> assertThat(exception.getErrorCode()).isEqualTo(expected));
  }
}
