package com.nguyendat.chatappserver.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MarkChatReadRequest(@NotNull @Positive Long messageId) {}
