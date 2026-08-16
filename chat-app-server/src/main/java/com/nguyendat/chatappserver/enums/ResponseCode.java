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
  USER_FOUND(1004, "Lấy thông tin người dùng thành công"),
  FRIEND_REQUEST_DELETED(1005, "Đã hủy hoặc từ chối lời mời kết bạn"),
  FRIENDSHIP_DELETED(1006, "Đã hủy kết bạn"),
  FRIEND_REQUESTS_RETRIEVED(1007, "Lấy danh sách lời mời kết bạn thành công"),
  FRIEND_REQUEST_ACCEPTED(1008, "Đã chấp nhận lời mời kết bạn"),
  FRIEND_LIST_RETRIEVED(1009, "Lấy danh sách bạn bè thành công"),
  FRIEND_REQUEST_SENT(1010, "Đã gửi lời mời kết bạn"),
  USER_BLOCKED(1011, "Đã chặn người dùng"),
  USER_UNBLOCKED(1012, "Đã bỏ chặn người dùng"),
  BLOCKED_USERS_RETRIEVED(1013, "Lấy danh sách người dùng bị chặn thành công"),
  DIRECT_CHAT_RETRIEVED(1014, "Lấy hoặc tạo cuộc trò chuyện trực tiếp thành công"),
  CHAT_LIST_RETRIEVED(1015, "Lấy danh sách cuộc trò chuyện thành công"),
  MESSAGE_HISTORY_RETRIEVED(1016, "Lấy lịch sử tin nhắn thành công"),
  MESSAGE_SENT(1017, "Gửi tin nhắn thành công"),
  CHAT_RETRIEVED(1018, "Lấy thông tin cuộc trò chuyện thành công"),
  ;

  private final int code;
  private final String message;
}
