package com.nguyendat.chatappserver.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.model.RefreshToken;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.RefreshTokenRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RefreshTokenServiceIntegrationTest {

  @Autowired RefreshTokenService refreshTokenService;
  @Autowired RefreshTokenRepository refreshTokenRepository;
  @Autowired UserRepository userRepository;
  @Autowired EntityManager entityManager;

  User user;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setEmail("refresh-test@example.com");
    user.setPassword("encoded-password");
    user.setDisplayName("Refresh Test");

    user = userRepository.saveAndFlush(user);
  }

  @Nested
  class Create {

    @Test
    void shouldStoreOnlyTokenHash_whenCreatingRefreshToken() {
      String rawToken = refreshTokenService.create(user);

      flushAndClear();

      RefreshToken storedToken = getOnlyStoredToken();

      assertThat(rawToken).isNotBlank();

      assertThat(storedToken.getTokenHash())
          .isNotEqualTo(rawToken)
          .isEqualTo(sha256(rawToken))
          .hasSize(64);

      assertThat(storedToken.getUser().getId()).isEqualTo(user.getId());
      assertThat(storedToken.getExpiresAt()).isAfter(LocalDateTime.now());
      assertThat(storedToken.getRevokedAt()).isNull();
    }
  }

  @Nested
  class Rotate {

    @Test
    void shouldInvalidateOldToken_whenRotating() {
      String oldRawToken = refreshTokenService.create(user);

      RefreshTokenService.RefreshTokenResult result = refreshTokenService.rotate(oldRawToken);

      String newRawToken = result.rawToken();

      flushAndClear();

      assertThat(newRawToken).isNotBlank().isNotEqualTo(oldRawToken);

      assertAppError(() -> refreshTokenService.rotate(oldRawToken), ErrorCode.INVALID_TOKEN);
    }

    @Test
    void shouldRejectRevokedToken() {
      String rawToken = refreshTokenService.create(user);

      refreshTokenService.revoke(rawToken);

      flushAndClear();

      assertAppError(() -> refreshTokenService.rotate(rawToken), ErrorCode.INVALID_TOKEN);
    }

    @Test
    void shouldRejectExpiredToken() {
      String rawToken = refreshTokenService.create(user);

      RefreshToken storedToken = getOnlyStoredToken();
      storedToken.setExpiresAt(LocalDateTime.now().minusMinutes(1));

      refreshTokenRepository.saveAndFlush(storedToken);
      entityManager.clear();

      assertAppError(() -> refreshTokenService.rotate(rawToken), ErrorCode.TOKEN_EXPIRED);
    }
  }

  @Nested
  class Revoke {

    @Test
    void shouldUpdateRevokedAt_whenLoggingOut() {
      String rawToken = refreshTokenService.create(user);

      refreshTokenService.revoke(rawToken);

      flushAndClear();

      RefreshToken storedToken = getOnlyStoredToken();

      assertThat(storedToken.getRevokedAt()).isNotNull();
      assertThat(storedToken.getRevokedAt()).isBeforeOrEqualTo(LocalDateTime.now());
    }

    @Test
    void shouldRemainSuccessful_whenLoggingOutTwice() {
      String rawToken = refreshTokenService.create(user);

      refreshTokenService.revoke(rawToken);

      flushAndClear();

      LocalDateTime firstRevokedAt = getOnlyStoredToken().getRevokedAt();

      assertThatCode(() -> refreshTokenService.revoke(rawToken)).doesNotThrowAnyException();

      flushAndClear();

      LocalDateTime secondRevokedAt = getOnlyStoredToken().getRevokedAt();

      assertThat(secondRevokedAt).isNotNull().isEqualTo(firstRevokedAt);
    }
  }

  private RefreshToken getOnlyStoredToken() {
    assertThat(refreshTokenRepository.findAll()).hasSize(1);
    return refreshTokenRepository.findAll().getFirst();
  }

  private void flushAndClear() {
    refreshTokenRepository.flush();
    entityManager.clear();
  }

  private void assertAppError(Runnable action, ErrorCode expectedError) {
    assertThatThrownBy(action::run)
        .isInstanceOfSatisfying(
            AppException.class,
            exception -> assertThat(exception.getErrorCode()).isEqualTo(expectedError));
  }

  private String sha256(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");

      byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));

      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException exception) {
      throw new AssertionError(exception);
    }
  }
}
