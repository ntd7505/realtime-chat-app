package com.nguyendat.chatappserver.dto.response;

import com.nguyendat.chatappserver.enums.FriendshipStatus;

public record FriendshipChangedPayload(
    Long friendshipId, Long requesterId, Long recipientId, FriendshipStatus status) {}
