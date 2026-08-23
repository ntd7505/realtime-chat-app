package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.config.RefreshTokenProperties;
import com.nguyendat.chatappserver.dto.request.LoginRequest;
import com.nguyendat.chatappserver.dto.request.RegisterRequest;
import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.LoginResponse;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.service.AuthenticationService;
import com.nguyendat.chatappserver.service.UserService;
import jakarta.validation.Valid;
import java.time.Duration;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class AuthenticationController {

  AuthenticationService authenticationService;
  UserService userService;
  RefreshTokenProperties refreshTokenProperties;

  @PostMapping("/register")
  public ResponseEntity<ApiResponse<UserResponse>> registerUser(
      @Valid @RequestBody RegisterRequest request) {
    UserResponse result = userService.registerUser(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(ResponseCode.USER_REGISTERED, result));
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginResponse>> authenticate(
      @Valid @RequestBody LoginRequest loginRequest) {

    AuthenticationService.AuthenticationResult result = authenticationService.login(loginRequest);

    ResponseCookie refreshTokenCookie = buildRefreshTokenCookie(result.rawRefreshToken());

    ApiResponse<LoginResponse> responseBody =
        ApiResponse.success(ResponseCode.LOGIN_SUCCESS, result.response());

    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
        .body(responseBody);
  }

  @PostMapping("/refresh")
  public ResponseEntity<ApiResponse<LoginResponse>> refresh(
      @CookieValue(name = "${app.refresh-token.cookie.name}", required = false)
          String rawRefreshToken) {
    AuthenticationService.AuthenticationResult result =
        authenticationService.refresh(rawRefreshToken);

    ResponseCookie newRefreshCookie = buildRefreshTokenCookie(result.rawRefreshToken());

    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, newRefreshCookie.toString())
        .body(ApiResponse.success(ResponseCode.SUCCESS, result.response()));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @CookieValue(name = "${app.refresh-token.cookie.name}", required = false)
          String rawRefreshToken) {
    authenticationService.logout(rawRefreshToken);

    ResponseCookie deletedCookie = buildDeletedRefreshTokenCookie();

    return ResponseEntity.noContent()
        .header(HttpHeaders.SET_COOKIE, deletedCookie.toString())
        .build();
  }

  private ResponseCookie buildRefreshTokenCookie(String rawRefreshToken) {
    RefreshTokenProperties.Cookie config = refreshTokenProperties.cookie();

    return ResponseCookie.from(config.name(), rawRefreshToken)
        .httpOnly(config.httpOnly())
        .secure(config.secure())
        .sameSite(config.sameSite())
        .path(config.path())
        .maxAge(Duration.ofSeconds(refreshTokenProperties.expiration()))
        .build();
  }

  private ResponseCookie buildDeletedRefreshTokenCookie() {
    RefreshTokenProperties.Cookie config = refreshTokenProperties.cookie();

    return ResponseCookie.from(config.name(), "")
        .path(config.path())
        .httpOnly(config.httpOnly())
        .secure(config.secure())
        .sameSite(config.sameSite())
        .maxAge(Duration.ZERO)
        .build();
  }
}
