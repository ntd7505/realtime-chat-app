package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.UserMapper;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.model.UserBlock;
import com.nguyendat.chatappserver.repository.FriendshipRepository;
import com.nguyendat.chatappserver.repository.UserBlockRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.UserBlockService;
import java.util.List;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserBlockServiceImpl implements UserBlockService {

  UserRepository userRepository;
  UserBlockRepository userBlockRepository;
  FriendshipRepository friendshipRepository;
  UserMapper userMapper;

  @Override
  @Transactional
  public void blockUser(User currentUser, Long userId) {
    if (Objects.equals(currentUser.getId(), userId)) {
      throw new AppException(ErrorCode.CANNOT_BLOCK_YOURSELF);
    }

    User blockedUser =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    boolean alreadyBlocked =
        userBlockRepository.existsByBlockerIdAndBlockedUserId(currentUser.getId(), userId);

    if (alreadyBlocked) {
      throw new AppException(ErrorCode.USER_ALREADY_BLOCKED);
    }

    friendshipRepository.deleteRelationshipBetween(currentUser.getId(), userId);

    UserBlock userBlock = new UserBlock();
    userBlock.setBlocker(currentUser);
    userBlock.setBlockedUser(blockedUser);

    userBlockRepository.save(userBlock);
  }

  @Override
  @Transactional
  public void unblockUser(User currentUser, Long userId) {
    int deletedRows = userBlockRepository.deleteBlock(currentUser.getId(), userId);

    if (deletedRows == 0) {
      throw new AppException(ErrorCode.USER_BLOCK_NOT_FOUND);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public List<UserSummaryResponse> getBlockedUsers(User currentUser) {
    return userBlockRepository.findAllBlockedUsers(currentUser.getId()).stream()
        .map(UserBlock::getBlockedUser)
        .map(userMapper::toUserSummaryResponse)
        .toList();
  }
}
