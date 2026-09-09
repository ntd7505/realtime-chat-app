package com.nguyendat.chatappserver.event;

import com.nguyendat.chatappserver.dto.response.FriendshipChangedPayload;
import java.util.Set;

public record FriendshipChangedEvent(
    String type, Set<Long> audienceUserIds, FriendshipChangedPayload payload) {}
