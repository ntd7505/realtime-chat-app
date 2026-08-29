package com.nguyendat.chatappserver.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AvatarUploadSignatureResponse {
    private String cloudName;
    private String apiKey;
    private long timestamp;
    private String signature;
    private String publicId;
    private boolean overwrite;
    private boolean invalidate;
}