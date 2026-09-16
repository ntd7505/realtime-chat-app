package com.nguyendat.chatappserver.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nguyendat.chatappserver.config.cloudinary.CloudinaryProperties;
import com.nguyendat.chatappserver.dto.request.CompleteAvatarUploadRequest;
import com.nguyendat.chatappserver.dto.response.AvatarUploadSignatureResponse;
import com.nguyendat.chatappserver.dto.response.UserResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.UserMapper;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.AvatarService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AvatarServiceImpl implements AvatarService {

    Cloudinary cloudinary;
    CloudinaryProperties properties;
    UserRepository userRepository;
    UserMapper userMapper;
    private static final int CLOUDINARY_SIGNATURE_VERSION = 2;

    @Override
    public AvatarUploadSignatureResponse createUploadSignature(User currentUser) {
        
        long timestamp = Instant.now().getEpochSecond();
        String publicId = "chat-app/avatars/user-" + currentUser.getId();

        Map<String, Object> parameters =
                ObjectUtils.asMap(
                        "timestamp", timestamp,
                        "public_id", publicId,
                        "overwrite", true,
                        "invalidate", true);

        String signature =
                cloudinary.apiSignRequest(
                        parameters,
                        properties.apiSecret(),
                        CLOUDINARY_SIGNATURE_VERSION);

        return AvatarUploadSignatureResponse.builder()
                .cloudName(properties.cloudName())
                .apiKey(properties.apiKey())
                .timestamp(timestamp)
                .signature(signature)
                .publicId(publicId)
                .overwrite(true)
                .invalidate(true)
                .build();
    }

    @Transactional
    public UserResponse completeUpload(
            User currentUser,
            CompleteAvatarUploadRequest request) {

        String expectedPublicId =
                "chat-app/avatars/user-" + currentUser.getId();

        if (!expectedPublicId.equals(request.getPublicId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        boolean validSignature =
                cloudinary.verifyApiResponseSignature(
                        request.getPublicId(),
                        String.valueOf(request.getVersion()),
                        request.getSignature());

        if (!validSignature) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        User user =
                userRepository
                        .findById(currentUser.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String avatarUrl =
                cloudinary
                        .url()
                        .secure(true)
                        .version(request.getVersion())
                        .generate(request.getPublicId());

        user.setAvatarPublicId(request.getPublicId());
        user.setAvatarUrl(avatarUrl);

        return userMapper.toUserResponse(userRepository.save(user));
    }
}
