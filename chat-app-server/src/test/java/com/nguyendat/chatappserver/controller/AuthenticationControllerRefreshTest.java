package com.nguyendat.chatappserver.controller;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nguyendat.chatappserver.config.RefreshTokenProperties;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.AuthenticationService;
import com.nguyendat.chatappserver.service.UserService;
import com.nguyendat.chatappserver.service.impl.JwtService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = AuthenticationController.class,
    properties = {"app.refresh-token.cookie.name=refresh_token"})
@AutoConfigureMockMvc(addFilters = false)
class AuthenticationControllerRefreshTest {

  private static final String REFRESH_ENDPOINT = "/auth/refresh";
  private static final String COOKIE_NAME = "refresh_token";
  private static final String RAW_REFRESH_TOKEN = "invalid-refresh-token";

  @Autowired MockMvc mockMvc;

  @MockitoBean AuthenticationService authenticationService;

  @MockitoBean UserService userService;

  @MockitoBean RefreshTokenProperties refreshTokenProperties;

  @MockitoBean JwtService jwtService;

  @MockitoBean UserRepository userRepository;

  @Nested
  class Refresh {

    @Test
    void shouldReturn401_whenRefreshTokenIsRevoked() throws Exception {
      assertUnauthorized(ErrorCode.INVALID_TOKEN);
    }

    @Test
    void shouldReturn401_whenRefreshTokenIsExpired() throws Exception {
      assertUnauthorized(ErrorCode.TOKEN_EXPIRED);
    }
  }

  private void assertUnauthorized(ErrorCode errorCode) throws Exception {
    given(authenticationService.refresh(RAW_REFRESH_TOKEN)).willThrow(new AppException(errorCode));

    mockMvc
        .perform(post(REFRESH_ENDPOINT).cookie(new Cookie(COOKIE_NAME, RAW_REFRESH_TOKEN)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.code").value(errorCode.getCode()))
        .andExpect(jsonPath("$.message").value(errorCode.getMessage()))
        .andExpect(jsonPath("$.error.code").value(errorCode.name()));

    then(authenticationService).should().refresh(RAW_REFRESH_TOKEN);
  }
}
