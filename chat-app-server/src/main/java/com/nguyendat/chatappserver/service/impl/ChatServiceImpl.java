package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.response.ChatReadResponse;
import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.event.ChatReadEvent;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.ChatMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.ChatMember;
import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.*;
import com.nguyendat.chatappserver.service.ChatService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.ApplicationEventPublisher;
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
  MessageRepository messageRepository;
  ChatMapper chatMapper;
  DirectChatCreator directChatCreator;
  ChatMemberRepository chatMemberRepository;
  ApplicationEventPublisher eventPublisher;
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
      return toChatResponse(existingChat.get(), targetUser, currentUser.getId());
    }

    friendshipRepository
        .findRelationshipBetween(currentUser.getId(), targetUserId)
        .filter(friendship -> friendship.getStatus() == FriendshipStatus.ACCEPTED)
        .orElseThrow(() -> new AppException(ErrorCode.USERS_ARE_NOT_FRIENDS));

    return chatRepository
        .findByDirectKey(directKey)
        .map(chat -> toChatResponse(chat, targetUser, currentUser.getId()))
        .orElseGet(() -> createOrFindChat(currentUser, targetUser, directKey));
  }

  @Override
  @Transactional(readOnly = true)
  public CursorPageResponse<ChatResponse> getMyChats(User currentUser, String cursor, int limit) {

    validateLimit(limit);

    ChatCursor decodedCursor = decodeCursor(cursor);

    Pageable pageable = PageRequest.of(0, limit + 1);

    List<ChatMember> members;

    if (decodedCursor.time() == null) {
      members = chatMemberRepository.findFirstDirectChatsByUserId(currentUser.getId(), pageable);
    } else {
      members =
          chatMemberRepository.findDirectChatsBeforeCursor(
              currentUser.getId(), decodedCursor.time(), decodedCursor.chatId(), pageable);
    }

    boolean hasNext = members.size() > limit;

    List<ChatMember> pageMembers = members.stream().limit(limit).toList();

    List<Long> chatIds =
        pageMembers.stream().map(chatMember -> chatMember.getChat().getId()).toList();

    List<Message> lastMessages =
        chatIds.isEmpty() ? List.of() : messageRepository.findLatestMessagesByChatIds(chatIds);

    Map<Long, Message> lastMessageByChatId =
        lastMessages.stream()
            .collect(Collectors.toMap(message -> message.getChat().getId(), Function.identity()));

    Map<Long, Long> unreadByChatId = countUnreadByChatId(currentUser.getId(), chatIds);

    List<ChatResponse> items =
        pageMembers.stream()
            .map(
                member -> {
                  Chat chat = member.getChat();

                  Message lastMessage = lastMessageByChatId.get(chat.getId());

                  return chatMapper.toChatResponse(
                      chat,
                      member.getUser(),
                      lastMessage,
                      unreadByChatId.getOrDefault(chat.getId(), 0L));
                })
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

  @Override
  @Transactional(readOnly = true)
  public ChatResponse getChatById(User currentUser, Long chatId) {

    ChatMember otherMember =
        chatMemberRepository
            .findDirectChatForUser(chatId, currentUser.getId())
            .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_FOUND));

    return toChatResponse(otherMember.getChat(), otherMember.getUser(), currentUser.getId());
  }

  @Override
  @Transactional
  public ChatReadResponse markAsRead(User currentUser, Long chatId, Long messageId) {
    ChatMember otherMember =
        chatMemberRepository
            .findDirectChatForUser(chatId, currentUser.getId())
            .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_FOUND));

    ChatMember currentMember =
        chatMemberRepository
            .findMemberForReadUpdate(chatId, currentUser.getId())
            .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_FOUND));

    Message message =
        messageRepository
            .findByIdAndChat_Id(messageId, chatId)
            .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

    Message lastReadMessage = currentMember.getLastReadMessage();
    boolean advanced = lastReadMessage == null || message.getId() > lastReadMessage.getId();

    if (advanced) {
      currentMember.setLastReadMessage(message);
      eventPublisher.publishEvent(
          new ChatReadEvent(
              chatId, currentUser.getId(), otherMember.getUser().getId(), message.getId()));
    }

    Long effectiveLastReadMessageId =
        currentMember.getLastReadMessage() == null
            ? null
            : currentMember.getLastReadMessage().getId();

    return new ChatReadResponse(chatId, currentUser.getId(), effectiveLastReadMessageId);
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

      return chatMapper.toChatResponse(chat, targetUser, null, 0L);

    } catch (DataIntegrityViolationException exception) {
      return chatRepository
          .findByDirectKey(directKey)
          .map(chat -> toChatResponse(chat, targetUser, currentUser.getId()))
          .orElseThrow(() -> exception);
    }
  }

  private ChatResponse toChatResponse(Chat chat, User otherUser, Long currentUserId) {
    Message lastMessage =
        messageRepository.findFirstByChat_IdOrderByIdDesc(chat.getId()).orElse(null);

    long unreadCount =
        countUnreadByChatId(currentUserId, List.of(chat.getId())).getOrDefault(chat.getId(), 0L);
    return chatMapper.toChatResponse(chat, otherUser, lastMessage, unreadCount);
  }

  private Map<Long, Long> countUnreadByChatId(Long userId, List<Long> chatIds) {
    if (chatIds.isEmpty()) {
      return Collections.emptyMap();
    }
    return messageRepository.countUnreadMessages(userId, chatIds).stream()
        .collect(Collectors.toMap(count -> count.getChatId(), count -> count.getUnreadCount()));
  }

  private record ChatCursor(LocalDateTime time, Long chatId) {}
}
