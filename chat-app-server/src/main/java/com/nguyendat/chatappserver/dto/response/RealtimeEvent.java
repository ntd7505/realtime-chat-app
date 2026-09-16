package com.nguyendat.chatappserver.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RealtimeEvent<T> {
  UUID eventId;
  String type;
  Long chatId;
  T payload;
  LocalDateTime occurredAt;

  public static <T> RealtimeEvent<T> of(String type, Long chatId, T payload) {
    return RealtimeEvent.<T>builder()
        .eventId(UUID.randomUUID())
        .type(type)
        .chatId(chatId)
        .payload(payload)
        .occurredAt(LocalDateTime.now())
        .build();
  }
}
