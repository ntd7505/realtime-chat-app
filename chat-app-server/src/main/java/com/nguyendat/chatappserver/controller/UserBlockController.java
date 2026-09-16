package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.UserBlockService;
import java.util.List;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserBlockController {

  UserBlockService userBlockService;

  @PostMapping("/{userId}/block")
  public ResponseEntity<ApiResponse<Void>> blockUser(
      @AuthenticationPrincipal User currentUser, @PathVariable Long userId) {
    userBlockService.blockUser(currentUser, userId);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.USER_BLOCKED, null));
  }

  @DeleteMapping("/{userId}/block")
  public ResponseEntity<ApiResponse<Void>> unblockUser(
      @AuthenticationPrincipal User currentUser, @PathVariable Long userId) {
    userBlockService.unblockUser(currentUser, userId);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.USER_UNBLOCKED, null));
  }

  @GetMapping("/blocked")
  public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getBlockedUsers(
      @AuthenticationPrincipal User currentUser) {
    List<UserSummaryResponse> result = userBlockService.getBlockedUsers(currentUser);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.BLOCKED_USERS_RETRIEVED, result));
  }
}
