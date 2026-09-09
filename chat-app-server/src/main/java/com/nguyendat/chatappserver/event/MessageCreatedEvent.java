package com.nguyendat.chatappserver.event;

import com.nguyendat.chatappserver.dto.response.MessageResponse;

public record MessageCreatedEvent(
    Long chatId, Long senderId, Long recipientId, MessageResponse message) {}
