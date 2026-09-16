package com.nguyendat.chatappserver.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class RedisPresenceServiceTest {

  @Mock StringRedisTemplate redisTemplate;

  @Mock ValueOperations<String, String> valueOperations;

  RedisPresenceService presenceService;

  @BeforeEach
  void setUp() {
    presenceService = new RedisPresenceService(redisTemplate);
  }

  @Test
  void touchShouldStorePresenceWithTtl() {
    when(redisTemplate.opsForValue()).thenReturn(valueOperations);

    presenceService.touch(15L);

    verify(valueOperations).set("chat-app:presence:user:15", "1", Duration.ofSeconds(90));
  }

  @Test
  void isOnlineShouldReturnTrueWhenKeyExists() {
    when(redisTemplate.hasKey("chat-app:presence:user:15")).thenReturn(true);

    boolean result = presenceService.isOnline(15L);

    assertThat(result).isTrue();
  }

  @Test
  void isOnlineShouldReturnFalseWhenKeyDoesNotExist() {
    when(redisTemplate.hasKey("chat-app:presence:user:15")).thenReturn(false);

    boolean result = presenceService.isOnline(15L);

    assertThat(result).isFalse();
  }

  @Test
  void shouldRejectNullUserId() {
    org.junit.jupiter.api.Assertions.assertThrows(
        NullPointerException.class, () -> presenceService.touch(null));
  }

  @Test
  void getStatusesShouldReturnOnlineStateForEachDistinctUser() {
    when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    when(valueOperations.multiGet(List.of("chat-app:presence:user:2", "chat-app:presence:user:3")))
        .thenReturn(Arrays.asList("1", null));

    Map<Long, Boolean> result = presenceService.getStatuses(List.of(2L, 3L, 2L));

    assertThat(result).containsExactly(Map.entry(2L, true), Map.entry(3L, false));
  }
}
