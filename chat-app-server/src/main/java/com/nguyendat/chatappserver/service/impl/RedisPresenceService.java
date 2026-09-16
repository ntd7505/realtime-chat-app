package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.service.PresenceService;
import java.time.Duration;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisPresenceService implements PresenceService {

  private static final String KEY_PREFIX = "chat-app:presence:user:";
  private static final String ONLINE_VALUE = "1";
  private static final Duration PRESENCE_TTL = Duration.ofSeconds(90);

  private final StringRedisTemplate redisTemplate;

  @Override
  public void touch(Long userId) {
    String key = buildKey(userId);

    redisTemplate.opsForValue().set(key, ONLINE_VALUE, PRESENCE_TTL);
  }

  @Override
  public boolean isOnline(Long userId) {
    return Boolean.TRUE.equals(redisTemplate.hasKey(buildKey(userId)));
  }

  @Override
  public Map<Long, Boolean> getStatuses(Collection<Long> userIds) {
    Objects.requireNonNull(userIds, "userIds must not be null");
    List<Long> distinctUserIds = userIds.stream().map(Objects::requireNonNull).distinct().toList();
    if (distinctUserIds.isEmpty()) {
      return Map.of();
    }

    List<String> keys = distinctUserIds.stream().map(this::buildKey).toList();
    List<String> values = redisTemplate.opsForValue().multiGet(keys);
    Map<Long, Boolean> statuses = new LinkedHashMap<>();

    for (int index = 0; index < distinctUserIds.size(); index++) {
      boolean online = values != null && index < values.size() && values.get(index) != null;
      statuses.put(distinctUserIds.get(index), online);
    }
    return statuses;
  }

  private String buildKey(Long userId) {
    Objects.requireNonNull(userId, "userId must not be null");
    return KEY_PREFIX + userId;
  }
}
