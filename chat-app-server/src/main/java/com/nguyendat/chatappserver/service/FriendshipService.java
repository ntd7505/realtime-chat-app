package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.response.FriendshipResponse;
import com.nguyendat.chatappserver.dto.response.UserSummaryResponse;
import com.nguyendat.chatappserver.model.User;
import java.util.List;

public interface FriendshipService {

  FriendshipResponse friendRequest(Long userId);

  FriendshipResponse acceptFriendRequest(Long userId);

  void deleteFriendRequest(Long userId);

  void unfriend(User currentUser, Long userId);

  List<UserSummaryResponse> getFriendList(User currentUser);

  List<UserSummaryResponse> getReceivedFriendRequests(User currentUser);
}
