package com.nguyendat.chatappserver.dto.response;

public record LoginResponse(String accessToken, String tokenType, long expiresIn, UserInfo user) {
  public record UserInfo(Long id, String email, String displayName, String avatarUrl) {}
}
