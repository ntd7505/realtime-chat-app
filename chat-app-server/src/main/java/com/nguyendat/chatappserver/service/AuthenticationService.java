package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.LoginRequest;
import com.nguyendat.chatappserver.dto.response.LoginResponse;

public interface AuthenticationService {

  LoginResponse login(LoginRequest request);
}
