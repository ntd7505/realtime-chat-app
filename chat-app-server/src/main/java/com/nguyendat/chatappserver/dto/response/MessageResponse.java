package com.nguyendat.chatappserver.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageResponse {

  Long id;

  UUID clientMessageId;

  UserSummaryResponse sender;

  String content;

  LocalDateTime createdAt;
}
