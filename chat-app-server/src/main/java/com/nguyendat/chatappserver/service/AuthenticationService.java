package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.LoginRequest;
import com.nguyendat.chatappserver.dto.response.LoginResponse;

public interface AuthenticationService {

  AuthenticationResult login(LoginRequest request);

  AuthenticationResult refresh(String rawRefreshToken);

  void logout(String rawRefreshToken);

  record AuthenticationResult(LoginResponse response, String rawRefreshToken) {}
}
