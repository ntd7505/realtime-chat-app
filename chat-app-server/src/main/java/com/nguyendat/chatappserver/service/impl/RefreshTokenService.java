package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.config.RefreshTokenProperties;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.model.RefreshToken;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RefreshTokenService {

  RefreshTokenRepository refreshTokenRepository;
  RefreshTokenProperties refreshTokenProperties;
  SecureRandom secureRandom = new SecureRandom();

  @Transactional
  public String create(User user) {
    String rawToken = generateRawToken();

    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setUser(user);
    refreshToken.setTokenHash(hash(rawToken));
    refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenProperties.expiration()));

    refreshTokenRepository.save(refreshToken);

    return rawToken;
  }

  @Transactional
  public RefreshTokenResult rotate(String rawToken) {
    RefreshToken refreshToken = findValidTokenForUpdate(rawToken);

    String newRawToken = generateRawToken();
    refreshToken.setTokenHash(hash(newRawToken));

    return new RefreshTokenResult(refreshToken.getUser(), newRawToken);
  }

  @Transactional
  public void revoke(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) {
      return;
    }

    String tokenHash = hash(rawToken);

    Optional<RefreshToken> optionalToken =
        refreshTokenRepository.findByTokenHashForUpdate(tokenHash);

    if (optionalToken.isEmpty()) {
      return;
    }

    RefreshToken refreshToken = optionalToken.get();

    if (refreshToken.getRevokedAt() != null) {
      return;
    }

    refreshToken.setRevokedAt(LocalDateTime.now());
  }

  private RefreshToken findValidTokenForUpdate(String rawToken) {
    if (rawToken == null || rawToken.isBlank()) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    String tokenHash = hash(rawToken);

    RefreshToken refreshToken =
        refreshTokenRepository
            .findByTokenHashForUpdate(tokenHash)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

    if (refreshToken.getRevokedAt() != null) {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    LocalDateTime now = LocalDateTime.now();

    if (!refreshToken.getExpiresAt().isAfter(now)) {
      throw new AppException(ErrorCode.TOKEN_EXPIRED);
    }

    return refreshToken;
  }

  private String generateRawToken() {
    byte[] bytes = new byte[32];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String hash(String rawToken) {
    try {
      MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");

      byte[] tokenBytes = rawToken.getBytes(StandardCharsets.UTF_8);

      byte[] hashBytes = messageDigest.digest(tokenBytes);

      return HexFormat.of().formatHex(hashBytes);

    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 algorithm is unavailable", exception);
    }
  }

  public record RefreshTokenResult(User user, String rawToken) {}
}
