package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.request.LoginRequest;
import com.nguyendat.chatappserver.dto.response.LoginResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.AuthenticationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationServiceImpl implements AuthenticationService {

  UserRepository userRepository;
  PasswordEncoder passwordEncoder;
  JwtService jwtService;
  RefreshTokenService refreshTokenService;

  @Override
  public AuthenticationResult login(LoginRequest request) {
    User user =
        userRepository
            .findUserByEmail(request.getEmail())
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    String accessToken = jwtService.generateAccessToken(user);

    var refreshToken = refreshTokenService.create(user);

    LoginResponse loginResponse = buildLoginResponse(accessToken, user);

    return new AuthenticationResult(loginResponse, refreshToken);
  }

  @Override
  public AuthenticationResult refresh(String rawRefreshToken) {

    RefreshTokenService.RefreshTokenResult rotated = refreshTokenService.rotate(rawRefreshToken);

    User user = rotated.user();

    String accessToken = jwtService.generateAccessToken(user);

    LoginResponse loginResponse = buildLoginResponse(accessToken, user);

    return new AuthenticationResult(loginResponse, rotated.rawToken());
  }

  @Override
  public void logout(String rawRefreshToken) {
    refreshTokenService.revoke(rawRefreshToken);
  }

  private LoginResponse buildLoginResponse(String accessToken, User user) {
    return new LoginResponse(
        accessToken,
        "Bearer",
        jwtService.getAccessTokenExpiration(),
        new LoginResponse.UserInfo(
            user.getId(), user.getEmail(), user.getDisplayName(), user.getAvatarUrl()));
  }
}
