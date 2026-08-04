package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.request.LoginRequest;
import com.nguyendat.chatappserver.dto.request.RegisterRequest;
import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.LoginResponse;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.service.AuthenticationService;
import com.nguyendat.chatappserver.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class AuthenticationController {

  AuthenticationService authenticationService;
  UserService userService;

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
    LoginResponse result = authenticationService.login(loginRequest);
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.LOGIN_SUCCESS, result));
  }
}
