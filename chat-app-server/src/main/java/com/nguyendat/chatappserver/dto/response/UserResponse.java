package com.nguyendat.chatappserver.dto.response;

import java.time.LocalDateTime;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {

  Long id;
  String email;
  String displayName;
  String avatarUrl;
  LocalDateTime createdAt;
}
