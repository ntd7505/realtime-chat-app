package com.nguyendat.chatappserver.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ResponseCode {
  SUCCESS(1000, "Thành công"),
  USER_REGISTERED(1001, "Đăng ký tài khoản thành công"),
  LOGIN_SUCCESS(1002, "Đăng nhập thành công"),
  LOGOUT_SUCCESS(1003, "Đăng xuất thành công"),
  USER_FOUND(1004, "Lấy thông tin người dùng thành công");

  private final int code;
  private final String message;
}
