package com.nguyendat.chatappserver.dto.response;

public record ChatReadResponse(Long chatId, Long userId, Long lastReadMessageId) {}
