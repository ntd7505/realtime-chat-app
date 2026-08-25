package com.nguyendat.chatappserver.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.refresh-token")
public record RefreshTokenProperties(long expiration, Cookie cookie) {
  public record Cookie(
      String name, String path, boolean httpOnly, String sameSite, boolean secure) {}
}
