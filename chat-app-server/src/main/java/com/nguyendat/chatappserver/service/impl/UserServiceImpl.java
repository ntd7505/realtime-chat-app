package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.request.RegisterRequest;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.UserMapper;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements UserService {

  UserRepository userRepository;
  UserMapper userMapper;
  PasswordEncoder passwordEncoder;

  @Override
  public UserResponse registerUser(RegisterRequest request) {
    if (userRepository.existsUserByEmail(request.getEmail()))
      throw new AppException(ErrorCode.USER_EXISTED);

    User user = userMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    User savedUser = userRepository.save(user);

    return userMapper.toUserResponse(savedUser);
  }
}
