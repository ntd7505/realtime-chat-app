package com.nguyendat.chatappserver.support;

import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.model.User;

public final class TestFixtures {

  private TestFixtures() {}

  public static User user(long id, String email, String displayName) {
    User user = new User();
    user.setId(id);
    user.setEmail(email);
    user.setPassword("encoded-password");
    user.setDisplayName(displayName);
    user.setAvatarUrl("https://example.com/avatar.png");
    return user;
  }

  public static UserResponse userResponse(long id, String email, String displayName) {
    return UserResponse.builder()
        .id(id)
        .email(email)
        .displayName(displayName)
        .avatarUrl("https://example.com/avatar.png")
        .build();
  }

  public static UserSummaryResponse userSummary(long id, String displayName) {
    return UserSummaryResponse.builder()
        .id(id)
        .displayName(displayName)
        .avatarUrl("https://example.com/avatar.png")
        .build();
  }
}
