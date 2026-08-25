package com.nguyendat.chatappserver.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.nguyendat.chatappserver.dto.request.RegisterRequest;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.UserMapper;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

  @Mock UserRepository userRepository;

  @Mock UserMapper userMapper;

  @Mock PasswordEncoder passwordEncoder;

  @InjectMocks UserServiceImpl userService;

  @Nested
  class RegisterUser {

    @Test
    void shouldSaveUserWithEncodedPassword_whenEmailIsAvailable() {
      RegisterRequest request = registerRequest();

      User mappedUser = user(null, request.getEmail(), request.getDisplayName());
      User savedUser = user(1L, request.getEmail(), request.getDisplayName());
      UserResponse expectedResponse = userResponse(savedUser);

      given(userRepository.existsUserByEmail(request.getEmail())).willReturn(false);
      given(userMapper.toUser(request)).willReturn(mappedUser);
      given(passwordEncoder.encode(request.getPassword())).willReturn("encoded-password");
      given(userRepository.save(mappedUser)).willReturn(savedUser);
      given(userMapper.toUserResponse(savedUser)).willReturn(expectedResponse);

      UserResponse actualResponse = userService.registerUser(request);

      assertThat(actualResponse).isSameAs(expectedResponse);
      assertThat(mappedUser.getPassword()).isEqualTo("encoded-password");

      then(userRepository).should().existsUserByEmail(request.getEmail());
      then(passwordEncoder).should().encode(request.getPassword());
      then(userRepository).should().save(mappedUser);
      then(userMapper).should().toUserResponse(savedUser);
    }

    @Test
    void shouldThrowUserExisted_whenEmailAlreadyExists() {
      RegisterRequest request = registerRequest();

      given(userRepository.existsUserByEmail(request.getEmail())).willReturn(true);

      assertThatThrownBy(() -> userService.registerUser(request))
          .isInstanceOfSatisfying(
              AppException.class,
              exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.USER_EXISTED));

      then(userMapper).should(never()).toUser(any());
      then(passwordEncoder).should(never()).encode(any());
      then(userRepository).should(never()).save(any());
    }
  }

  @Nested
  class GetMyInfo {

    @Test
    void shouldReturnMappedCurrentUser() {
      User currentUser = user(1L, "current@example.com", "Current User");
      UserResponse expectedResponse = userResponse(currentUser);

      given(userMapper.toUserResponse(currentUser)).willReturn(expectedResponse);

      UserResponse actualResponse = userService.getMyInfo(currentUser);

      assertThat(actualResponse).isSameAs(expectedResponse);

      then(userMapper).should().toUserResponse(currentUser);
      then(userRepository).shouldHaveNoInteractions();
    }
  }

  @Nested
  class GetUserById {

    @Test
    void shouldReturnUser_whenUserExists() {
      User foundUser = user(2L, "found@example.com", "Found User");
      UserResponse expectedResponse = userResponse(foundUser);

      given(userRepository.findById(2L)).willReturn(Optional.of(foundUser));
      given(userMapper.toUserResponse(foundUser)).willReturn(expectedResponse);

      UserResponse actualResponse = userService.getUserById(2L);

      assertThat(actualResponse).isSameAs(expectedResponse);
      assertThat(actualResponse.getId()).isEqualTo(2L);
      assertThat(actualResponse.getEmail()).isEqualTo("found@example.com");

      then(userRepository).should().findById(2L);
      then(userMapper).should().toUserResponse(foundUser);
    }

    @Test
    void shouldThrowUserNotFound_whenUserDoesNotExist() {
      given(userRepository.findById(999L)).willReturn(Optional.empty());

      assertThatThrownBy(() -> userService.getUserById(999L))
          .isInstanceOfSatisfying(
              AppException.class,
              exception ->
                  assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND));

      then(userMapper).should(never()).toUserResponse(any());
    }
  }

  @Nested
  class SearchUsers {

    @Test
    void shouldTrimKeywordAndReturnMappedUsers() {
      User firstUser = user(1L, "alice@example.com", "Alice");
      User secondUser = user(2L, "alison@example.com", "Alison");

      UserResponse firstResponse = userResponse(firstUser);
      UserResponse secondResponse = userResponse(secondUser);

      given(
              userRepository
                  .findTop20ByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByDisplayNameAsc(
                      "ali", "ali"))
          .willReturn(List.of(firstUser, secondUser));

      given(userMapper.toUserResponse(firstUser)).willReturn(firstResponse);
      given(userMapper.toUserResponse(secondUser)).willReturn(secondResponse);

      List<UserResponse> actualResult = userService.searchUsers("  ali  ");

      assertThat(actualResult).hasSize(2).containsExactly(firstResponse, secondResponse);

      then(userRepository)
          .should()
          .findTop20ByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByDisplayNameAsc(
              "ali", "ali");
    }

    @Test
    void shouldReturnEmptyList_whenNoUserMatchesKeyword() {
      given(
              userRepository
                  .findTop20ByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByDisplayNameAsc(
                      "unknown", "unknown"))
          .willReturn(List.of());

      List<UserResponse> actualResult = userService.searchUsers("unknown");

      assertThat(actualResult).isEmpty();
      then(userMapper).shouldHaveNoInteractions();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "   "})
    void shouldThrowInvalidRequest_whenKeywordIsBlank(String keyword) {
      assertThatThrownBy(() -> userService.searchUsers(keyword))
          .isInstanceOfSatisfying(
              AppException.class,
              exception ->
                  assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INVALID_REQUEST));

      then(userRepository).shouldHaveNoInteractions();
      then(userMapper).shouldHaveNoInteractions();
    }
  }

  private RegisterRequest registerRequest() {
    RegisterRequest request = new RegisterRequest();
    request.setEmail("user@example.com");
    request.setPassword("password123");
    request.setDisplayName("Test User");
    request.setAvatarUrl("https://example.com/avatar.png");
    return request;
  }

  private User user(Long id, String email, String displayName) {
    User user = new User();
    user.setId(id);
    user.setEmail(email);
    user.setDisplayName(displayName);
    user.setPassword("encoded-password");
    user.setAvatarUrl("https://example.com/avatar.png");
    user.setCreatedAt(LocalDateTime.of(2026, 8, 20, 10, 0));
    return user;
  }

  private UserResponse userResponse(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .displayName(user.getDisplayName())
        .avatarUrl(user.getAvatarUrl())
        .createdAt(user.getCreatedAt())
        .build();
  }
}
