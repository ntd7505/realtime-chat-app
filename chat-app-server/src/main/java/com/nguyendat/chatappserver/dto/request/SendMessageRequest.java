package com.nguyendat.chatappserver.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendMessageRequest {
  @NotNull(message = "CLIENT_MESSAGE_ID_REQUIRED")
  UUID clientMessageId;

  @NotBlank(message = "MESSAGE_CONTENT_REQUIRED")
  @Size(max = 5000, message = "MESSAGE_CONTENT_TOO_LONG")
  String content;
}
