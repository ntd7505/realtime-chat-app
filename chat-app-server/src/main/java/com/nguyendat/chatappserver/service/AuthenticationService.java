package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.LoginRequest;
import com.nguyendat.chatappserver.dto.response.LoginResponse;
import org.springframework.stereotype.Service;

public interface AuthenticationService {

    LoginResponse login(LoginRequest request);
}
