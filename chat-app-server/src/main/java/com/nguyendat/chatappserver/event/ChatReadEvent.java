package com.nguyendat.chatappserver.event;

public record ChatReadEvent(Long chatId, Long readerId, Long otherUserId, Long lastReadMessageId) {}
