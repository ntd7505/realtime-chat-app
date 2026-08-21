package com.nguyendat.chatappserver.config;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;

import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.impl.JwtService;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();

        String secret =
                Base64.getEncoder()
                        .encodeToString(
                                "01234567890123456789012345678901"
                                        .getBytes(StandardCharsets.UTF_8));

        ReflectionTestUtils.setField(jwtService, "secret", secret);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 3600L);
    }

    @Test
    void shouldGenerateValidTokenAndExtractUserId() {
        User user = user(7L, "user@example.com", "User");

        String token = jwtService.generateAccessToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(7L);
    }

    @Test
    void shouldReturnFalse_whenTokenWasModified() {
        User user = user(7L, "user@example.com", "User");

        String token = jwtService.generateAccessToken(user);
        String modifiedToken = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.isValid(modifiedToken)).isFalse();
    }

    @Test
    void shouldReturnFalse_whenTokenIsMalformed() {
        assertThat(jwtService.isValid("not-a-jwt-token")).isFalse();
    }
}