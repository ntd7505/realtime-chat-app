package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.ChatMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.*;
import com.nguyendat.chatappserver.service.ChatService;

import java.util.Optional;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatServiceImpl implements ChatService {

    ChatRepository chatRepository;
    UserRepository userRepository;
    UserBlockRepository userBlockRepository;
    FriendshipRepository friendshipRepository;
    ChatMapper chatMapper;
    DirectChatCreator directChatCreator;

    @Override
    public ChatResponse createOrGetDirectChat(User currentUser, Long targetUserId) {
        if (currentUser.getId().equals(targetUserId))
            throw new AppException(ErrorCode.CANNOT_CREATE_CHAT_WITH_YOURSELF);
        User targetUser =
                userRepository
                        .findById(targetUserId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (userBlockRepository.existsBlockBetween(currentUser.getId(), targetUserId))
            throw new AppException(ErrorCode.CANNOT_CREATE_CHAT_WITH_BLOCKED_USER);

        String directKey = generateDirectKey(currentUser.getId(), targetUserId);

        Optional<Chat> existingChat = chatRepository.findByDirectKey(directKey);

        if (existingChat.isPresent()) {
            return chatMapper.toChatResponse(existingChat.get(), targetUser);
        }

        friendshipRepository
                .findRelationshipBetween(currentUser.getId(), targetUserId)
                .filter(friendship -> friendship.getStatus() == FriendshipStatus.ACCEPTED)
                .orElseThrow(() -> new AppException(ErrorCode.USERS_ARE_NOT_FRIENDS));

        return chatRepository
                .findByDirectKey(directKey)
                .map(chat -> chatMapper.toChatResponse(chat, targetUser))
                .orElseGet(() -> createOrFindChat(currentUser, targetUser, directKey));
    }

    // helper
    private String generateDirectKey(Long firstUserId, Long secondUserId) {
        long firstId = Math.min(firstUserId, secondUserId);
        long secondId = Math.max(firstUserId, secondUserId);
        return firstId + ":" + secondId;
    }

    private ChatResponse createOrFindChat(
            User currentUser,
            User targetUser,
            String directKey
    ) {
        try {
            Chat chat = directChatCreator.create(
                    currentUser,
                    targetUser,
                    directKey
            );

            return chatMapper.toChatResponse(chat, targetUser);

        } catch (DataIntegrityViolationException exception) {
            return chatRepository
                    .findByDirectKey(directKey)
                    .map(chat ->
                            chatMapper.toChatResponse(chat, targetUser)
                    )
                    .orElseThrow(() -> exception);
        }
    }
}
