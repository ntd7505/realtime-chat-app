package com.nguyendat.chatappserver.service;

public interface PresenceService {

  void touch(Long userId);

  boolean isOnline(Long userId);
}
