package com.nguyendat.chatappserver.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
  UNCATEGORIZED_EXCEPTION(2000, "Đã xảy ra lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),

  INVALID_REQUEST(2001, "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),

  VALIDATION_ERROR(2002, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),

  EMAIL_ALREADY_EXISTS(2003, "Email đã được sử dụng", HttpStatus.CONFLICT),

  USER_NOT_FOUND(2004, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),

  INVALID_CREDENTIALS(2005, "Email hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED),

  UNAUTHENTICATED(
      2006, "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn", HttpStatus.UNAUTHORIZED),

  INVALID_TOKEN(2007, "Token không hợp lệ", HttpStatus.UNAUTHORIZED),

  ACCESS_DENIED(2008, "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),

  USER_EXISTED(2009, "Người dùng đã tồn tại trong hệ thống", HttpStatus.CONFLICT),

  // validation
  EMAIL_INVALID(2010, "Email không hợp lệ", HttpStatus.BAD_REQUEST),
  EMAIL_REQUIRED(2011, "Email không được để trống", HttpStatus.BAD_REQUEST),
  PASSWORD_REQUIRED(2012, "Mật khẩu không được để trống", HttpStatus.BAD_REQUEST),
  PASSWORD_TOO_SHORT(2013, "Mật khẩu phải có ít nhất 8 ký tự", HttpStatus.BAD_REQUEST),
  DISPLAY_NAME_REQUIRED(2014, "Tên hiển thị không được để trống", HttpStatus.BAD_REQUEST),
  DISPLAY_NAME_TOO_LONG(2015, "Tên hiển thị tối đa 100 ký tự", HttpStatus.BAD_REQUEST);

  private final int code;
  private final String message;
  private final HttpStatusCode statusCode;
}
