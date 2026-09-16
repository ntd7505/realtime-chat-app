package com.nguyendat.chatappserver.service;

import java.util.Collection;
import java.util.Map;

public interface PresenceService {

  void touch(Long userId);

  boolean isOnline(Long userId);

  Map<Long, Boolean> getStatuses(Collection<Long> userIds);
}
