package com.nguyendat.chatappserver.service.impl;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.nguyendat.chatappserver.dto.request.LoginRequest;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.AuthenticationService;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceImplTest {

  @Mock UserRepository userRepository;
  @Mock PasswordEncoder passwordEncoder;
  @Mock JwtService jwtService;
  @Mock RefreshTokenService refreshTokenService;

  @InjectMocks AuthenticationServiceImpl authenticationService;

  @Nested
  class Login {

    @Test
    void shouldReturnTokenAndUserInfo_whenCredentialsAreValid() {
      LoginRequest request = loginRequest();
      User foundUser = user(1L, "user@example.com", "Test User");

      given(userRepository.findUserByEmail(request.getEmail())).willReturn(Optional.of(foundUser));
      given(passwordEncoder.matches("password123", "encoded-password")).willReturn(true);
      given(jwtService.generateAccessToken(foundUser)).willReturn("access-token");
      given(jwtService.getAccessTokenExpiration()).willReturn(3600L);
      given(refreshTokenService.create(foundUser)).willReturn("refresh-token");

      AuthenticationService.AuthenticationResult response = authenticationService.login(request);

      assertThat(response.response().accessToken()).isEqualTo("access-token");
      assertThat(response.response().tokenType()).isEqualTo("Bearer");
      assertThat(response.response().expiresIn()).isEqualTo(3600);
      assertThat(response.response().user().id()).isEqualTo(1L);
      assertThat(response.response().user().email()).isEqualTo("user@example.com");
      assertThat(response.response().user().displayName()).isEqualTo("Test User");
      assertThat(response.rawRefreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void shouldThrowInvalidCredentials_whenEmailDoesNotExist() {
      LoginRequest request = loginRequest();

      given(userRepository.findUserByEmail(request.getEmail())).willReturn(Optional.empty());

      assertAppError(() -> authenticationService.login(request), ErrorCode.INVALID_CREDENTIALS);

      then(passwordEncoder).shouldHaveNoInteractions();
      then(jwtService).shouldHaveNoInteractions();
    }

    @Test
    void shouldThrowInvalidCredentials_whenPasswordIsIncorrect() {
      LoginRequest request = loginRequest();
      User foundUser = user(1L, "user@example.com", "Test User");

      given(userRepository.findUserByEmail(request.getEmail())).willReturn(Optional.of(foundUser));
      given(passwordEncoder.matches("password123", "encoded-password")).willReturn(false);

      assertAppError(() -> authenticationService.login(request), ErrorCode.INVALID_CREDENTIALS);

      then(jwtService)
          .should(never().description("JWT must not be generated"))
          .generateAccessToken(foundUser);
    }
  }

  private LoginRequest loginRequest() {
    LoginRequest request = new LoginRequest();
    request.setEmail("user@example.com");
    request.setPassword("password123");
    return request;
  }

  private void assertAppError(Runnable action, ErrorCode expected) {
    assertThatThrownBy(action::run)
        .isInstanceOfSatisfying(
            AppException.class,
            exception -> assertThat(exception.getErrorCode()).isEqualTo(expected));
  }
}
