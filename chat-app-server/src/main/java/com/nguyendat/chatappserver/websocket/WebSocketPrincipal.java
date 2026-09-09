package com.nguyendat.chatappserver.websocket;

import com.nguyendat.chatappserver.model.User;
import java.security.Principal;

public record WebSocketPrincipal(User user) implements Principal {

  @Override
  public String getName() {
    return user.getId().toString();
  }
}
