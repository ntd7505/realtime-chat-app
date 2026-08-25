package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.config.JwtProperties;
import com.nguyendat.chatappserver.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.sql.Date;
import java.time.Instant;
import javax.crypto.SecretKey;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JwtService {

  private final JwtProperties jwtProperties;

  public String generateAccessToken(User user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(String.valueOf(user.getId()))
        .claim("email", user.getEmail())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(jwtProperties.accessTokenExpiration())))
        .signWith(getSigningKey())
        .compact();
  }

  public Long extractUserId(String token) {
    Claims claims = extractClaims(token);
    return Long.valueOf(claims.getSubject());
  }

  public boolean isValid(String token) {
    try {
      extractClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException exception) {
      return false;
    }
  }

  public long getAccessTokenExpiration() {
    return jwtProperties.accessTokenExpiration();
  }

  private Claims extractClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }

  private SecretKey getSigningKey() {
    byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.secret());
    return Keys.hmacShaKeyFor(keyBytes);
  }
}
