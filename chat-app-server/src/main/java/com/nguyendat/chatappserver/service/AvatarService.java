package com.nguyendat.chatappserver.service;

import com.nguyendat.chatappserver.dto.request.CompleteAvatarUploadRequest;
import com.nguyendat.chatappserver.dto.response.AvatarUploadSignatureResponse;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.model.User;

public interface AvatarService {

    AvatarUploadSignatureResponse createUploadSignature(User currentUser);

    UserResponse completeUpload(
            User currentUser,
            CompleteAvatarUploadRequest request);
}
