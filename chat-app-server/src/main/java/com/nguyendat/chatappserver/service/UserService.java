package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.RegisterRequest;
import com.nguyendat.chatappserver.dto.response.UserResponse;


public interface UserService {

    UserResponse registerUser(RegisterRequest request);
}
