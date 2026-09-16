package com.nguyendat.chatappserver.dto.response;

import com.nguyendat.chatappserver.enums.ChatType;
import java.time.LocalDateTime;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatResponse {

  Long id;

  ChatType type;

  UserSummaryResponse otherUser;

  MessageResponse lastMessage;

  long unreadCount;

  LocalDateTime lastMessageAt;

  LocalDateTime createdAt;
}
