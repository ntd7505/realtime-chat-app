package com.nguyendat.chatappserver.mapper;

import com.nguyendat.chatappserver.dto.response.FriendshipResponse;
import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.model.Friendship;
import com.nguyendat.chatappserver.model.User;
import java.util.Objects;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface FriendshipMapper {

  default FriendshipResponse toFriendshipResponse(Friendship friendship, Long currentUserId) {
    User otherUser =
        Objects.equals(friendship.getRequester().getId(), currentUserId)
            ? friendship.getRecipient()
            : friendship.getRequester();

    return FriendshipResponse.builder()
        .id(friendship.getId())
        .requesterId(friendship.getRequester().getId())
        .recipientId(friendship.getRecipient().getId())
        .status(friendship.getStatus())
        .user(toUserSummaryResponse(otherUser))
        .createdAt(friendship.getCreatedAt())
        .updatedAt(friendship.getUpdatedAt())
        .build();
  }

  UserSummaryResponse toUserSummaryResponse(User user);
}
