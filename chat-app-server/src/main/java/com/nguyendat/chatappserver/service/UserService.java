package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.RegisterRequest;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.model.User;
import java.util.List;

public interface UserService {

  UserResponse registerUser(RegisterRequest request);

  UserResponse getMyInfo(User user);

  UserResponse getUserById(Long userId);

  List<UserResponse> searchUsers(String keyword);
}
