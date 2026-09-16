package com.nguyendat.chatappserver.exception;

import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(Exception exception) {
    log.error("Unexpected exception", exception);

    ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.failure(errorCode, null));
  }

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<Void>> handleAppException(AppException exception) {
    ErrorCode errorCode = exception.getErrorCode();

    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.failure(errorCode, null));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidationException(
      MethodArgumentNotValidException exception) {
    Map<String, String> details =
        exception.getBindingResult().getFieldErrors().stream()
            .collect(
                Collectors.toMap(
                    FieldError::getField,
                    this::resolveValidationMessage,
                    (firstMessage, ignoredMessage) -> firstMessage,
                    LinkedHashMap::new));

    ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.failure(errorCode, details));
  }

  @ExceptionHandler({
    HandlerMethodValidationException.class,
    ConstraintViolationException.class,
    MissingServletRequestParameterException.class
  })
  public ResponseEntity<ApiResponse<Void>> handleRequestValidationException(Exception exception) {
    ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.failure(errorCode, null));
  }

  private String resolveValidationMessage(FieldError fieldError) {
    String errorCodeName = fieldError.getDefaultMessage();

    if (errorCodeName == null) {
      return ErrorCode.VALIDATION_ERROR.getMessage();
    }

    try {
      return ErrorCode.valueOf(errorCodeName).getMessage();
    } catch (IllegalArgumentException exception) {
      return errorCodeName;
    }
  }
}
