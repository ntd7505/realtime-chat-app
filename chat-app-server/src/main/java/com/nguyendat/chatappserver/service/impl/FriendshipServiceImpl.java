package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.response.FriendshipChangedPayload;
import com.nguyendat.chatappserver.dto.response.FriendshipResponse;
import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.event.FriendshipChangedEvent;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.FriendshipMapper;
import com.nguyendat.chatappserver.mapper.UserMapper;
import com.nguyendat.chatappserver.model.Friendship;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.realtime.RealtimeEventType;
import com.nguyendat.chatappserver.repository.FriendshipRepository;
import com.nguyendat.chatappserver.repository.UserBlockRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.FriendshipService;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FriendshipServiceImpl implements FriendshipService {

  UserBlockRepository userBlockRepository;
  UserRepository userRepository;
  UserMapper userMapper;
  FriendshipRepository friendshipRepository;
  FriendshipMapper friendshipMapper;
  ApplicationEventPublisher eventPublisher;

  @Override
  @Transactional
  public FriendshipResponse friendRequest(Long userId) {
    User user = getCurrentUser();
    if (Objects.equals(user.getId(), userId)) {
      throw new AppException(ErrorCode.CANNOT_SEND_FRIEND_REQUEST_TO_YOURSELF);
    }
    User recipient =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    friendshipRepository
        .findRelationshipBetween(user.getId(), userId)
        .ifPresent(
            friendship -> {
              if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new AppException(ErrorCode.ALREADY_FRIENDS);
              }

              throw new AppException(ErrorCode.FRIEND_REQUEST_ALREADY_EXISTS);
            });

    if (userBlockRepository.existsByBlockerIdAndBlockedUserId(userId, user.getId())) {
      throw new AppException(ErrorCode.CANNOT_SEND_FRIEND_REQUEST_TO_USER_WHO_BLOCKED_YOU);
    }

    if (userBlockRepository.existsByBlockerIdAndBlockedUserId(user.getId(), userId)) {
      throw new AppException(ErrorCode.CANNOT_SEND_FRIEND_REQUEST_TO_USER_BLOCKED_BY_YOU);
    }

    Friendship friendship =
        Friendship.builder()
            .requester(user)
            .recipient(recipient)
            .status(FriendshipStatus.PENDING)
            .build();

    Friendship savedFriendship = friendshipRepository.save(friendship);

    FriendshipResponse response =
        friendshipMapper.toFriendshipResponse(savedFriendship, user.getId());
    publishFriendshipChange(RealtimeEventType.FRIENDSHIP_REQUESTED, savedFriendship);
    return response;
  }

  @Override
  @Transactional
  public FriendshipResponse acceptFriendRequest(Long userId) {
    User currentUser = getCurrentUser();

    Friendship friendship =
        friendshipRepository
            .findFriendshipByRequester_IdAndRecipient_Id(userId, currentUser.getId())
            .orElseThrow(() -> new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));

    if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
      throw new AppException(ErrorCode.ALREADY_FRIENDS);
    }

    friendship.setStatus(FriendshipStatus.ACCEPTED);

    Friendship savedFriendship = friendshipRepository.save(friendship);

    FriendshipResponse response =
        friendshipMapper.toFriendshipResponse(savedFriendship, currentUser.getId());
    publishFriendshipChange(RealtimeEventType.FRIENDSHIP_ACCEPTED, savedFriendship);
    return response;
  }

  @Override
  @Transactional
  public void deleteFriendRequest(Long userId) {
    User currentUser = getCurrentUser();
    Friendship friendship =
        friendshipRepository
            .findRelationshipBetween(currentUser.getId(), userId)
            .filter(value -> value.getStatus() == FriendshipStatus.PENDING)
            .orElseThrow(() -> new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));

    int deletedRows =
        friendshipRepository.deleteFriendRequest(
            currentUser.getId(), userId, FriendshipStatus.PENDING);
    if (deletedRows == 0) {
      throw new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }
    publishFriendshipChange(RealtimeEventType.FRIENDSHIP_DELETED, friendship);
  }

  @Override
  @Transactional
  public void unfriend(User currentUser, Long userId) {
    Friendship friendship =
        friendshipRepository
            .findRelationshipBetween(currentUser.getId(), userId)
            .filter(value -> value.getStatus() == FriendshipStatus.ACCEPTED)
            .orElseThrow(() -> new AppException(ErrorCode.FRIENDSHIP_NOT_FOUND));

    int deletedRows =
        friendshipRepository.unfriend(currentUser.getId(), userId, FriendshipStatus.ACCEPTED);

    if (deletedRows == 0) {
      throw new AppException(ErrorCode.FRIENDSHIP_NOT_FOUND);
    }
    publishFriendshipChange(RealtimeEventType.FRIENDSHIP_DELETED, friendship);
  }

  @Override
  @Transactional(readOnly = true)
  public List<UserSummaryResponse> getFriendList(User currentUser) {
    List<Friendship> friendships =
        friendshipRepository.findAllFriendshipsOfUser(
            currentUser.getId(), FriendshipStatus.ACCEPTED);

    List<UserSummaryResponse> responses = new ArrayList<>();

    for (Friendship friendship : friendships) {
      User friend;

      if (friendship.getRequester().getId().equals(currentUser.getId())) {
        friend = friendship.getRecipient();
      } else {
        friend = friendship.getRequester();
      }

      responses.add(userMapper.toUserSummaryResponse(friend));
    }

    return responses;
  }

  @Override
  @Transactional(readOnly = true)
  public List<UserSummaryResponse> getReceivedFriendRequests(User currentUser) {
    List<Friendship> friendRequests =
        friendshipRepository.findAllReceivedRequests(currentUser.getId(), FriendshipStatus.PENDING);

    return friendRequests.stream()
        .map(Friendship::getRequester)
        .map(userMapper::toUserSummaryResponse)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<UserSummaryResponse> getSentFriendRequests(User currentUser) {
    return friendshipRepository
        .findAllSentRequests(currentUser.getId(), FriendshipStatus.PENDING)
        .stream()
        .map(Friendship::getRecipient)
        .map(userMapper::toUserSummaryResponse)
        .toList();
  }

  private void publishFriendshipChange(String type, Friendship friendship) {
    FriendshipChangedPayload payload =
        new FriendshipChangedPayload(
            friendship.getId(),
            friendship.getRequester().getId(),
            friendship.getRecipient().getId(),
            friendship.getStatus());
    eventPublisher.publishEvent(
        new FriendshipChangedEvent(
            type,
            Set.of(friendship.getRequester().getId(), friendship.getRecipient().getId()),
            payload));
  }

  private User getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null
        || !authentication.isAuthenticated()
        || !(authentication.getPrincipal() instanceof User user)) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    return user;
  }
}
