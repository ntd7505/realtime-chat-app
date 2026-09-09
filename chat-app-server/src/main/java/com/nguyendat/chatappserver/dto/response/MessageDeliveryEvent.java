package com.nguyendat.chatappserver.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MessageDeliveryEvent {
  String type;
  Long chatId;
  UUID clientMessageId;
  MessageResponse message;
  boolean duplicate;
  Integer code;
  String error;
}
