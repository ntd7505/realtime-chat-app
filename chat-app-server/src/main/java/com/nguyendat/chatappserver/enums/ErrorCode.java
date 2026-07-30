package com.nguyendat.chatappserver.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
  UNCATEGORIZED_EXCEPTION(2000, "Đã xảy ra lỗi không xác định"),
  INVALID_REQUEST(2001, "Dữ liệu yêu cầu không hợp lệ"),
  VALIDATION_ERROR(2002, "Dữ liệu đầu vào không hợp lệ"),
  EMAIL_ALREADY_EXISTS(2003, "Email đã được sử dụng"),
  USER_NOT_FOUND(2004, "Không tìm thấy người dùng"),
  INVALID_CREDENTIALS(2005, "Email hoặc mật khẩu không đúng"),
  UNAUTHENTICATED(2006, "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn"),
  INVALID_TOKEN(2007, "Token không hợp lệ"),
  ACCESS_DENIED(2008, "Bạn không có quyền thực hiện thao tác này"),
  USER_EXISTED(2009, "Người dùng đã tồn tại trong hệ thống");
  private final int code;
  private final String message;
}
