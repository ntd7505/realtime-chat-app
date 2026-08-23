package com.nguyendat.chatappserver.mapper;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;

import com.nguyendat.chatappserver.dto.response.FriendshipResponse;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.model.Friendship;
import com.nguyendat.chatappserver.model.User;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class FriendshipMapperTest {

  FriendshipMapper friendshipMapper = Mappers.getMapper(FriendshipMapper.class);

  @Test
  void shouldUseRecipientAsOtherUser_whenCurrentUserIsRequester() {
    User requester = user(1L, "requester@example.com", "Requester");
    User recipient = user(2L, "recipient@example.com", "Recipient");

    Friendship friendship =
        Friendship.builder()
            .requester(requester)
            .recipient(recipient)
            .status(FriendshipStatus.ACCEPTED)
            .build();

    FriendshipResponse response = friendshipMapper.toFriendshipResponse(friendship, 1L);

    assertThat(response.getRequesterId()).isEqualTo(1L);
    assertThat(response.getRecipientId()).isEqualTo(2L);
    assertThat(response.getStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
    assertThat(response.getUser().getId()).isEqualTo(2L);
    assertThat(response.getUser().getDisplayName()).isEqualTo("Recipient");
  }

  @Test
  void shouldUseRequesterAsOtherUser_whenCurrentUserIsRecipient() {
    User requester = user(1L, "requester@example.com", "Requester");
    User recipient = user(2L, "recipient@example.com", "Recipient");

    Friendship friendship =
        Friendship.builder()
            .requester(requester)
            .recipient(recipient)
            .status(FriendshipStatus.ACCEPTED)
            .build();

    FriendshipResponse response = friendshipMapper.toFriendshipResponse(friendship, 2L);

    assertThat(response.getUser().getId()).isEqualTo(1L);
    assertThat(response.getUser().getDisplayName()).isEqualTo("Requester");
  }
}
