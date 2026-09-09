package com.nguyendat.chatappserver.repository.projection;

public interface ChatUnreadCount {
  Long getChatId();

  Long getUnreadCount();
}
