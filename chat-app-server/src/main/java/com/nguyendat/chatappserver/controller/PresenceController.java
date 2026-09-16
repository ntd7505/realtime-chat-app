package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.UserPresenceResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.service.PresenceService;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/presence")
@RequiredArgsConstructor
@Validated
public class PresenceController {

  private final PresenceService presenceService;

  @GetMapping
  public ResponseEntity<ApiResponse<List<UserPresenceResponse>>> getStatuses(
      @RequestParam @NotEmpty @Size(max = 100) List<@Positive Long> userIds) {
    if (userIds.size() > 100
        || userIds.stream().anyMatch(userId -> userId == null || userId <= 0)) {
      throw new AppException(ErrorCode.VALIDATION_ERROR);
    }

    List<UserPresenceResponse> result =
        presenceService.getStatuses(userIds).entrySet().stream()
            .map(entry -> new UserPresenceResponse(entry.getKey(), entry.getValue()))
            .toList();

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.SUCCESS, result));
  }
}
