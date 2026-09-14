package com.nguyendat.chatappserver.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.nguyendat.chatappserver.service.PresenceService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class RedisPresenceIntegrationTest {

  private static final int REDIS_PORT = 6379;
  private static final Long TEST_USER_ID = ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE);
  private static final String TEST_KEY = "chat-app:presence:user:" + TEST_USER_ID;

  @Container
  static final GenericContainer<?> REDIS =
      new GenericContainer<>(DockerImageName.parse("redis:8-alpine")).withExposedPorts(REDIS_PORT);

  @Autowired PresenceService presenceService;

  @Autowired StringRedisTemplate redisTemplate;

  @DynamicPropertySource
  static void configureRedis(DynamicPropertyRegistry registry) {
    registry.add("spring.data.redis.host", REDIS::getHost);
    registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(REDIS_PORT));
  }

  @AfterEach
  void cleanUp() {
    redisTemplate.delete(TEST_KEY);
  }

  @Test
  void shouldStorePresenceInRealRedis() {
    presenceService.touch(TEST_USER_ID);

    String value = redisTemplate.opsForValue().get(TEST_KEY);
    Long ttl = redisTemplate.getExpire(TEST_KEY, TimeUnit.SECONDS);

    assertThat(value).isEqualTo("1");
    assertThat(ttl).isNotNull();
    assertThat(ttl).isPositive();
    assertThat(ttl).isLessThanOrEqualTo(90);
    assertThat(presenceService.isOnline(TEST_USER_ID)).isTrue();
  }

  @Test
  void touchShouldRefreshTtl() throws InterruptedException {
    presenceService.touch(TEST_USER_ID);

    Thread.sleep(150);

    Long ttlBeforeRefresh = redisTemplate.getExpire(TEST_KEY, TimeUnit.MILLISECONDS);

    presenceService.touch(TEST_USER_ID);

    Long ttlAfterRefresh = redisTemplate.getExpire(TEST_KEY, TimeUnit.MILLISECONDS);

    assertThat(ttlBeforeRefresh).isNotNull();
    assertThat(ttlAfterRefresh).isNotNull();
    assertThat(ttlAfterRefresh).isGreaterThan(ttlBeforeRefresh);
  }

  @Test
  void shouldReturnOfflineWhenKeyDoesNotExist() {
    redisTemplate.delete(TEST_KEY);

    boolean online = presenceService.isOnline(TEST_USER_ID);

    assertThat(online).isFalse();
  }
}
