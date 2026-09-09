package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.event.MessageCreatedEvent;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.MessageMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatRepository;
import com.nguyendat.chatappserver.repository.MessageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageCreator {

  MessageRepository messageRepository;
  MessageMapper messageMapper;
  ChatRepository chatRepository;
  ApplicationEventPublisher eventPublisher;

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public MessageResponse create(
      SendMessageRequest request, Long chatId, User sender, Long recipientId) {

    Chat chat =
        chatRepository
            .findByIdForUpdate(chatId)
            .orElseThrow(() -> new AppException(ErrorCode.CHAT_NOT_FOUND));

    Message message = new Message();
    message.setChat(chat);
    message.setSender(sender);
    message.setContent(request.getContent());
    message.setClientMessageId(request.getClientMessageId());

    Message savedMessage = messageRepository.saveAndFlush(message);

    chat.setLastMessageAt(savedMessage.getCreatedAt());

    MessageResponse response = messageMapper.toMessageResponse(savedMessage);
    eventPublisher.publishEvent(
        new MessageCreatedEvent(chatId, sender.getId(), recipientId, response));

    return response;
  }
}
