package com.nguyendat.chatappserver.service.impl;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static com.nguyendat.chatappserver.support.TestFixtures.userSummary;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.UserMapper;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.model.UserBlock;
import com.nguyendat.chatappserver.repository.FriendshipRepository;
import com.nguyendat.chatappserver.repository.UserBlockRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserBlockServiceImplTest {

  @Mock UserRepository userRepository;
  @Mock UserBlockRepository userBlockRepository;
  @Mock FriendshipRepository friendshipRepository;
  @Mock UserMapper userMapper;

  @InjectMocks UserBlockServiceImpl userBlockService;

  @Nested
  class BlockUser {

    @Test
    void shouldDeleteFriendshipAndSaveBlock_whenRequestIsValid() {
      User currentUser = user(1L, "current@example.com", "Current");
      User targetUser = user(2L, "target@example.com", "Target");

      given(userRepository.findById(2L)).willReturn(Optional.of(targetUser));
      given(userBlockRepository.existsByBlockerIdAndBlockedUserId(1L, 2L)).willReturn(false);

      userBlockService.blockUser(currentUser, 2L);

      then(friendshipRepository).should().deleteRelationshipBetween(1L, 2L);

      ArgumentCaptor<UserBlock> captor = ArgumentCaptor.forClass(UserBlock.class);

      then(userBlockRepository).should().save(captor.capture());

      UserBlock savedBlock = captor.getValue();

      assertThat(savedBlock.getBlocker()).isSameAs(currentUser);
      assertThat(savedBlock.getBlockedUser()).isSameAs(targetUser);
    }

    @Test
    void shouldThrowCannotBlockYourself_whenTargetIsCurrentUser() {
      User currentUser = user(1L, "current@example.com", "Current");

      assertAppError(
          () -> userBlockService.blockUser(currentUser, 1L), ErrorCode.CANNOT_BLOCK_YOURSELF);

      then(userRepository).shouldHaveNoInteractions();
      then(userBlockRepository).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowUserNotFound_whenTargetDoesNotExist() {
      User currentUser = user(1L, "current@example.com", "Current");

      given(userRepository.findById(99L)).willReturn(Optional.empty());

      assertAppError(() -> userBlockService.blockUser(currentUser, 99L), ErrorCode.USER_NOT_FOUND);

      then(userBlockRepository).should(never()).save(any());
    }

    @Test
    void shouldThrowUserAlreadyBlocked_whenBlockAlreadyExists() {
      User currentUser = user(1L, "current@example.com", "Current");
      User targetUser = user(2L, "target@example.com", "Target");

      given(userRepository.findById(2L)).willReturn(Optional.of(targetUser));
      given(userBlockRepository.existsByBlockerIdAndBlockedUserId(1L, 2L)).willReturn(true);

      assertAppError(
          () -> userBlockService.blockUser(currentUser, 2L), ErrorCode.USER_ALREADY_BLOCKED);

      then(friendshipRepository).shouldHaveNoInteractions();
      then(userBlockRepository).should(never()).save(any());
    }
  }

  @Nested
  class UnblockUser {

    @Test
    void shouldComplete_whenBlockWasDeleted() {
      User currentUser = user(1L, "current@example.com", "Current");

      given(userBlockRepository.deleteBlock(1L, 2L)).willReturn(1);

      userBlockService.unblockUser(currentUser, 2L);

      then(userBlockRepository).should().deleteBlock(1L, 2L);
    }

    @Test
    void shouldThrowBlockNotFound_whenNoRowWasDeleted() {
      User currentUser = user(1L, "current@example.com", "Current");

      given(userBlockRepository.deleteBlock(1L, 2L)).willReturn(0);

      assertAppError(
          () -> userBlockService.unblockUser(currentUser, 2L), ErrorCode.USER_BLOCK_NOT_FOUND);
    }
  }

  @Nested
  class GetBlockedUsers {

    @Test
    void shouldReturnMappedBlockedUsers() {
      User currentUser = user(1L, "current@example.com", "Current");
      User blockedUser = user(2L, "blocked@example.com", "Blocked");
      UserSummaryResponse expected = userSummary(2L, "Blocked");

      UserBlock userBlock = new UserBlock();
      userBlock.setBlocker(currentUser);
      userBlock.setBlockedUser(blockedUser);

      given(userBlockRepository.findAllBlockedUsers(1L)).willReturn(List.of(userBlock));
      given(userMapper.toUserSummaryResponse(blockedUser)).willReturn(expected);

      List<UserSummaryResponse> actual = userBlockService.getBlockedUsers(currentUser);

      assertThat(actual).containsExactly(expected);
    }
  }

  private void assertAppError(Runnable action, ErrorCode expected) {
    assertThatThrownBy(action::run)
        .isInstanceOfSatisfying(
            AppException.class,
            exception -> assertThat(exception.getErrorCode()).isEqualTo(expected));
  }
}
