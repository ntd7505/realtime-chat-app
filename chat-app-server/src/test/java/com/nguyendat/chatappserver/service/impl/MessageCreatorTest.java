package com.nguyendat.chatappserver.service.impl;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.enums.ChatType;
import com.nguyendat.chatappserver.enums.ErrorCode;
import com.nguyendat.chatappserver.exception.AppException;
import com.nguyendat.chatappserver.mapper.MessageMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatRepository;
import com.nguyendat.chatappserver.repository.MessageRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MessageCreatorTest {

    @Mock
    MessageRepository messageRepository;
    @Mock
    MessageMapper messageMapper;
    @Mock
    ChatRepository chatRepository;

    @InjectMocks
    MessageCreator messageCreator;

    @Test
    void create_shouldSaveMessageAndUpdateChatLastMessageAt() {
        User sender = user(1L, "sender@example.com", "Sender");

        Chat chat = new Chat();
        chat.setId(10L);
        chat.setType(ChatType.DIRECT);

        SendMessageRequest request = new SendMessageRequest();
        request.setClientMessageId(UUID.randomUUID());
        request.setContent("Hello");

        LocalDateTime createdAt = LocalDateTime.of(2026, 8, 20, 10, 30);

        Message savedMessage = new Message();
        savedMessage.setId(100L);
        savedMessage.setChat(chat);
        savedMessage.setSender(sender);
        savedMessage.setClientMessageId(request.getClientMessageId());
        savedMessage.setContent(request.getContent());
        savedMessage.setCreatedAt(createdAt);

        MessageResponse expected =
                MessageResponse.builder()
                        .id(100L)
                        .clientMessageId(request.getClientMessageId())
                        .content("Hello")
                        .createdAt(createdAt)
                        .build();

        given(chatRepository.findByIdForUpdate(10L))
                .willReturn(Optional.of(chat));
        given(messageRepository.saveAndFlush(any(Message.class)))
                .willReturn(savedMessage);
        given(messageMapper.toMessageResponse(savedMessage))
                .willReturn(expected);

        MessageResponse actual =
                messageCreator.create(request, 10L, sender);

        assertThat(actual).isSameAs(expected);
        assertThat(chat.getLastMessageAt()).isEqualTo(createdAt);

        ArgumentCaptor<Message> captor =
                ArgumentCaptor.forClass(Message.class);

        then(messageRepository).should().saveAndFlush(captor.capture());

        Message messageToSave = captor.getValue();

        assertThat(messageToSave.getChat()).isSameAs(chat);
        assertThat(messageToSave.getSender()).isSameAs(sender);
        assertThat(messageToSave.getClientMessageId())
                .isEqualTo(request.getClientMessageId());
        assertThat(messageToSave.getContent()).isEqualTo("Hello");
    }

    @Test
    void create_shouldThrowChatNotFound_whenChatDoesNotExist() {
        User sender = user(1L, "sender@example.com", "Sender");

        SendMessageRequest request = new SendMessageRequest();
        request.setClientMessageId(UUID.randomUUID());
        request.setContent("Hello");

        given(chatRepository.findByIdForUpdate(99L))
                .willReturn(Optional.empty());

        assertThatThrownBy(() -> messageCreator.create(request, 99L, sender))
                .isInstanceOfSatisfying(
                        AppException.class,
                        exception ->
                                assertThat(exception.getErrorCode())
                                        .isEqualTo(ErrorCode.CHAT_NOT_FOUND));

        then(messageRepository).shouldHaveNoInteractions();
    }
}