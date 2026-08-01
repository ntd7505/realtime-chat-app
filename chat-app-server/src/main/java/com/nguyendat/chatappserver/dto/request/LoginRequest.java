package com.nguyendat.chatappserver.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginRequest {
  @Email(message = "EMAIL_INVALID")
  @NotBlank(message = "EMAIL_REQUIRED")
  String email;

  @NotBlank(message = "PASSWORD_REQUIRED")
  String password;
}
