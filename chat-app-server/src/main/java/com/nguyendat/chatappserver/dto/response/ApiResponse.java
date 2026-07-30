package com.nguyendat.chatappserver.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.ResponseCode;
import java.time.Instant;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApiResponse<T> {

  @Builder.Default private final boolean success = true;

  private final int code;
  private final String message;
  private final T data;
  private final ApiError error;

  @Builder.Default private final Instant timestamp = Instant.now();

  public static <T> ApiResponse<T> success(ResponseCode responseCode, T data) {
    return ApiResponse.<T>builder()
        .code(responseCode.getCode())
        .message(responseCode.getMessage())
        .data(data)
        .build();
  }

  public static ApiResponse<Void> failure(ErrorCode errorCode, Object details) {
    return ApiResponse.<Void>builder()
        .success(false)
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .error(new ApiError(errorCode.name(), details))
        .build();
  }

  @Getter
  @Builder
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ApiError {
    private final String code;
    private final Object details;
  }
}
