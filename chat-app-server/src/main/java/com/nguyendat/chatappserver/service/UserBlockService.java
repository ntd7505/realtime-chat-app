package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.model.User;
import java.util.List;

public interface UserBlockService {

  void blockUser(User currentUser, Long userId);

  void unblockUser(User currentUser, Long userId);

  List<UserSummaryResponse> getBlockedUsers(User currentUser);
}
