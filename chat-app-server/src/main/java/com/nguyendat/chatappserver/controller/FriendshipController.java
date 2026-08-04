package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.FriendshipResponse;
import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.FriendshipService;
import java.util.List;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/friends")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class FriendshipController {

  FriendshipService friendshipService;

  @PostMapping("/requests/{userId}")
  public ResponseEntity<ApiResponse<FriendshipResponse>> friendRequest(@PathVariable Long userId) {
    FriendshipResponse result = friendshipService.friendRequest(userId);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(ResponseCode.FRIEND_REQUEST_SENT, result));
  }

  @PatchMapping("/requests/{userId}/accept")
  public ResponseEntity<ApiResponse<FriendshipResponse>> acceptFriendRequest(
      @PathVariable Long userId) {
    FriendshipResponse result = friendshipService.acceptFriendRequest(userId);
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.FRIEND_REQUEST_ACCEPTED, result));
  }

  @GetMapping()
  public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getFriendList(
      @AuthenticationPrincipal User currentUser) {
    List<UserSummaryResponse> friendList = friendshipService.getFriendList(currentUser);
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.FRIEND_LIST_RETRIEVED, friendList));
  }

  @GetMapping("/requests/received")
  public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getReceivedFriendRequests(
      @AuthenticationPrincipal User currentUser) {
    List<UserSummaryResponse> result = friendshipService.getReceivedFriendRequests(currentUser);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.FRIEND_REQUESTS_RETRIEVED, result));
  }

  @DeleteMapping("/requests/{userId}")
  public ResponseEntity<?> cancelFriendRequest(@PathVariable Long userId) {
    friendshipService.deleteFriendRequest(userId);
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.FRIEND_REQUEST_DELETED, null));
  }

  @DeleteMapping("/{userId}")
  public ResponseEntity<?> unfriend(
      @PathVariable Long userId, @AuthenticationPrincipal User currentUser) {
    friendshipService.unfriend(currentUser, userId);
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.FRIENDSHIP_DELETED, null));
  }
}
