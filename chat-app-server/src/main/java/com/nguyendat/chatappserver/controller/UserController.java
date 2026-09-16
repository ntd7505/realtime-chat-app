package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.request.CompleteAvatarUploadRequest;
import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.AvatarUploadSignatureResponse;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.AvatarService;
import com.nguyendat.chatappserver.service.UserService;

import java.util.List;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UserController {

    UserService userService;
    AvatarService avatarService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo(@AuthenticationPrincipal User user) {
        UserResponse result = userService.getMyInfo(user);

        return ResponseEntity.ok(ApiResponse.success(ResponseCode.USER_FOUND, result));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId) {
        UserResponse result = userService.getUserById(userId);

        return ResponseEntity.ok(ApiResponse.success(ResponseCode.USER_FOUND, result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(@RequestParam String keyword) {
        List<UserResponse> result = userService.searchUsers(keyword);

        return ResponseEntity.ok(ApiResponse.success(ResponseCode.USER_FOUND, result));
    }

    @PostMapping("/me/avatar/signature")
    public ResponseEntity<ApiResponse<AvatarUploadSignatureResponse>>
    createAvatarUploadSignature(@AuthenticationPrincipal User user) {

        var result = avatarService.createUploadSignature(user);

        return ResponseEntity.ok(
                ApiResponse.success(ResponseCode.SUCCESS, result));
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> completeAvatarUpload(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CompleteAvatarUploadRequest request) {

        UserResponse result = avatarService.completeUpload(user, request);

        return ResponseEntity.ok(
                ApiResponse.success(ResponseCode.SUCCESS, result));
    }
}
