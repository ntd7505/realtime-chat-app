package com.nguyendat.chatappserver.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {

  @Email(message = "EMAIL_INVALID")
  @NotBlank(message = "EMAIL_REQUIRED")
  String email;

  @NotBlank(message = "PASSWORD_REQUIRED")
  @Size(min = 8, message = "PASSWORD_TOO_SHORT")
  String password;

  @NotBlank(message = "DISPLAY_NAME_REQUIRED")
  @Size(max = 100, message = "DISPLAY_NAME_TOO_LONG")
  String displayName;

  String avatarUrl;
}
