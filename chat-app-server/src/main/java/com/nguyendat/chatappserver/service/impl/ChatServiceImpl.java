package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.ChatMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.ChatMember;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.*;
import com.nguyendat.chatappserver.service.ChatService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
  ChatMemberRepository chatMemberRepository;
  static int MIN_CHAT_LIMIT = 1;
  static int MAX_CHAT_LIMIT = 50;

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

  @Override
  @Transactional(readOnly = true)
  public CursorPageResponse<ChatResponse> getMyChats(User currentUser, String cursor, int limit) {

    validateLimit(limit);

    ChatCursor decodedCursor = decodeCursor(cursor);

    Pageable pageable = PageRequest.of(0, limit + 1);

    List<ChatMember> members =
        chatMemberRepository.findDirectChatsByUserId(
            currentUser.getId(), decodedCursor.time(), decodedCursor.chatId(), pageable);

    boolean hasNext = members.size() > limit;

    List<ChatMember> pageMembers = members.stream().limit(limit).toList();

    List<ChatResponse> items =
        pageMembers.stream()
            .map(member -> chatMapper.toChatResponse(member.getChat(), member.getUser()))
            .toList();

    String nextCursor = null;

    if (hasNext && !pageMembers.isEmpty()) {
      Chat lastChat = pageMembers.getLast().getChat();

      LocalDateTime sortTime =
          lastChat.getLastMessageAt() != null
              ? lastChat.getLastMessageAt()
              : lastChat.getCreatedAt();

      nextCursor = encodeCursor(new ChatCursor(sortTime, lastChat.getId()));
    }

    return CursorPageResponse.<ChatResponse>builder()
        .items(items)
        .nextCursor(nextCursor)
        .hasNext(hasNext)
        .build();
  }

  // helper
  private String generateDirectKey(Long firstUserId, Long secondUserId) {
    long firstId = Math.min(firstUserId, secondUserId);
    long secondId = Math.max(firstUserId, secondUserId);
    return firstId + ":" + secondId;
  }

  private void validateLimit(int limit) {
    if (limit < MIN_CHAT_LIMIT || limit > MAX_CHAT_LIMIT) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
  }

  private String encodeCursor(ChatCursor cursor) {
    String rawCursor = cursor.time() + "|" + cursor.chatId();

    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(rawCursor.getBytes(StandardCharsets.UTF_8));
  }

  private ChatCursor decodeCursor(String cursor) {
    if (cursor == null || cursor.isBlank()) {
      return new ChatCursor(null, null);
    }

    try {
      String rawCursor = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
      String[] parts = rawCursor.split("\\|", -1);

      if (parts.length != 2) {
        throw new IllegalArgumentException("Invalid cursor structure");
      }

      LocalDateTime time = LocalDateTime.parse(parts[0]);
      Long chatId = Long.parseLong(parts[1]);

      if (chatId <= 0) throw new IllegalArgumentException("Invalid chat id");

      return new ChatCursor(time, chatId);

    } catch (IllegalArgumentException | DateTimeParseException exception) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
  }

  private ChatResponse createOrFindChat(User currentUser, User targetUser, String directKey) {
    try {
      Chat chat = directChatCreator.create(currentUser, targetUser, directKey);

      return chatMapper.toChatResponse(chat, targetUser);

    } catch (DataIntegrityViolationException exception) {
      return chatRepository
          .findByDirectKey(directKey)
          .map(chat -> chatMapper.toChatResponse(chat, targetUser))
          .orElseThrow(() -> exception);
    }
  }

  private record ChatCursor(LocalDateTime time, Long chatId) {}
}
