package com.nguyendat.chatappserver.dto.response;

import java.util.List;

public record MessageSyncResponse(
    List<MessageResponse> items, Long nextAfterMessageId, boolean hasMore) {}
