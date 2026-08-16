package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.MessageMapper;
import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.MessageRepository;
import com.nguyendat.chatappserver.service.MessageService;
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
  private static final int MIN_MESSAGE_LIMIT = 1;
  private static final int MAX_MESSAGE_LIMIT = 50;

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
  public MessageResponse sendMessage(SendMessageRequest request, Long chatId, User currentUser) {

    Long senderId = currentUser.getId();

    if (!chatMemberRepository.existsByChat_IdAndUser_Id(chatId, senderId)) {
      throw new AppException(ErrorCode.CHAT_NOT_FOUND);
    }

    Optional<Message> message =
        messageRepository.findMessageBySender_IdAndClientMessageId(
            senderId, request.getClientMessageId());

    if (message.isPresent()) {
      return messageMapper.toMessageResponse(message.get());
    }
    try {
      return messageCreator.create(request, chatId, currentUser);

    } catch (DataIntegrityViolationException exception) {
      Message messageRediscover =
          messageRepository
              .findMessageBySender_IdAndClientMessageId(senderId, request.getClientMessageId())
              .orElseThrow(() -> exception);
      return messageMapper.toMessageResponse(messageRediscover);
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
