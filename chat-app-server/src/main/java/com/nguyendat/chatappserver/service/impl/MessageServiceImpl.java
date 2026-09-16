package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.dto.response.MessageSyncResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.MessageMapper;
import com.nguyendat.chatappserver.model.ChatMember;
import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.MessageRepository;
import com.nguyendat.chatappserver.repository.UserBlockRepository;
import com.nguyendat.chatappserver.service.MessageService;
import com.nguyendat.chatappserver.service.result.SendMessageResult;
import java.nio.charset.StandardCharsets;
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
public class MessageServiceImpl implements MessageService {

  ChatMemberRepository chatMemberRepository;
  MessageRepository messageRepository;
  MessageMapper messageMapper;
  MessageCreator messageCreator;
  UserBlockRepository userBlockRepository;
  private static final int MIN_MESSAGE_LIMIT = 1;
  private static final int MAX_MESSAGE_LIMIT = 50;
  private static final int MAX_SYNC_LIMIT = 100;

  @Override
  @Transactional(readOnly = true)
  public CursorPageResponse<MessageResponse> getMessageHistory(
      User currentUser, Long chatId, String cursor, int limit) {

    validateLimit(limit);

    if (!chatMemberRepository.existsByChat_IdAndUser_Id(chatId, currentUser.getId()))
      throw new AppException(ErrorCode.CHAT_NOT_FOUND);

    Long decodedCursor = decodeCursor(cursor);

    Pageable pageable = PageRequest.of(0, limit + 1);

    List<Message> messages = messageRepository.findMessageHistory(chatId, decodedCursor, pageable);

    boolean hasNext = messages.size() > limit;

    List<Message> pageMessages = messages.stream().limit(limit).toList();

    List<MessageResponse> messageResponses =
        pageMessages.stream().map(messageMapper::toMessageResponse).toList();

    String nextCursor = null;

    if (hasNext && !pageMessages.isEmpty()) {
      long lastMessageId = pageMessages.getLast().getId();
      String rawCursor = String.valueOf(lastMessageId);
      nextCursor =
          Base64.getUrlEncoder()
              .withoutPadding()
              .encodeToString(rawCursor.getBytes(StandardCharsets.UTF_8));
    }

    return CursorPageResponse.<MessageResponse>builder()
        .items(messageResponses)
        .nextCursor(nextCursor)
        .hasNext(hasNext)
        .build();
  }

  @Override
  public SendMessageResult sendMessage(SendMessageRequest request, Long chatId, User currentUser) {

    Long senderId = currentUser.getId();
    Optional<Message> message =
        messageRepository.findMessageBySender_IdAndClientMessageId(
            senderId, request.getClientMessageId());

    if (message.isPresent()) {
      Message existing = message.get();
      validateIdempotentRetry(existing, request, chatId);
      return new SendMessageResult(messageMapper.toMessageResponse(existing), false);
    }

    ChatMember otherMember =
        chatMemberRepository
            .findDirectChatForUser(chatId, senderId)
            .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_FOUND));

    Long recipientId = otherMember.getUser().getId();

    if (userBlockRepository.existsBlockBetween(senderId, recipientId)) {
      throw new AppException(ErrorCode.CANNOT_MESSAGE_BLOCKED_USER);
    }

    try {
      MessageResponse created = messageCreator.create(request, chatId, currentUser, recipientId);
      return new SendMessageResult(created, true);

    } catch (DataIntegrityViolationException exception) {
      Message messageRediscover =
          messageRepository
              .findMessageBySender_IdAndClientMessageId(senderId, request.getClientMessageId())
              .orElseThrow(() -> exception);
      validateIdempotentRetry(messageRediscover, request, chatId);
      return new SendMessageResult(messageMapper.toMessageResponse(messageRediscover), false);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public MessageSyncResponse getMessagesAfter(
      User currentUser, Long chatId, Long afterMessageId, int limit) {
    validateSyncLimit(limit);
    if (afterMessageId == null || afterMessageId <= 0) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    if (!chatMemberRepository.existsByChat_IdAndUser_Id(chatId, currentUser.getId())) {
      throw new AppException(ErrorCode.CHAT_NOT_FOUND);
    }

    if (!messageRepository.existsByIdAndChat_Id(afterMessageId, chatId)) {
      throw new AppException(ErrorCode.MESSAGE_NOT_FOUND);
    }

    List<Message> messages =
        messageRepository.findMessagesAfter(chatId, afterMessageId, PageRequest.of(0, limit + 1));

    boolean hasMore = messages.size() > limit;
    List<Message> page = messages.stream().limit(limit).toList();
    Long nextAfterMessageId = hasMore && !page.isEmpty() ? page.getLast().getId() : null;

    return new MessageSyncResponse(
        page.stream().map(messageMapper::toMessageResponse).toList(), nextAfterMessageId, hasMore);
  }

  private void validateIdempotentRetry(
      Message existing, SendMessageRequest request, Long requestedChatId) {
    boolean sameChat = existing.getChat().getId().equals(requestedChatId);
    boolean sameContent = existing.getContent().equals(request.getContent());

    if (!sameChat || !sameContent) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
  }

  private void validateSyncLimit(int limit) {
    if (limit < MIN_MESSAGE_LIMIT || limit > MAX_SYNC_LIMIT) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
  }

  private Long decodeCursor(String cursor) {
    if (cursor == null || cursor.isBlank()) {
      return null;
    }
    try {
      String rawCursor = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
      long messageId = Long.parseLong(rawCursor);

      if (messageId <= 0) {
        throw new IllegalArgumentException();
      }

      return messageId;
    } catch (IllegalArgumentException exception) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
  }

  private void validateLimit(int limit) {
    if (limit < MIN_MESSAGE_LIMIT || limit > MAX_MESSAGE_LIMIT) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }
  }
}
