package com.nguyendat.chatappserver.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSummaryResponse {
  Long id;
  String displayName;
  String avatarUrl;
}
