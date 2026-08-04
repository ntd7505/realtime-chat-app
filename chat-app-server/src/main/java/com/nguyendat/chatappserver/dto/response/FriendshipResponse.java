package com.nguyendat.chatappserver.dto.response;

import com.nguyendat.chatappserver.enums.FriendshipStatus;
import java.time.LocalDateTime;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FriendshipResponse {

  Long id;

  Long requesterId;
  Long recipientId;

  FriendshipStatus status;

  UserSummaryResponse user;

  LocalDateTime createdAt;
  LocalDateTime updatedAt;
}
