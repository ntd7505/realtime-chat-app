package com.nguyendat.chatappserver.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompleteAvatarUploadRequest {

  @NotBlank private String publicId;

  @NotNull private Long version;

  @NotBlank private String signature;
}
