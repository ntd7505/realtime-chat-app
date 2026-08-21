package com.nguyendat.chatappserver.service.impl;

import static com.nguyendat.chatappserver.support.TestFixtures.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.nguyendat.chatappserver.enums.ChatType;
import com.nguyendat.chatappserver.mapper.ChatMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.ChatMember;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.ChatRepository;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DirectChatCreatorTest {

    @Mock
    ChatRepository chatRepository;
    @Mock
    ChatMemberRepository chatMemberRepository;
    @Mock
    ChatMapper chatMapper;

    @InjectMocks
    DirectChatCreator directChatCreator;

    @Test
    void create_shouldSaveDirectChatAndTwoMembers() {
        User currentUser = user(1L, "current@example.com", "Current");
        User targetUser = user(2L, "target@example.com", "Target");

        given(chatRepository.saveAndFlush(any(Chat.class)))
                .willAnswer(
                        invocation -> {
                            Chat chat = invocation.getArgument(0);
                            chat.setId(10L);
                            return chat;
                        });

        Chat result =
                directChatCreator.create(currentUser, targetUser, "1:2");

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getType()).isEqualTo(ChatType.DIRECT);
        assertThat(result.getDirectKey()).isEqualTo("1:2");
        assertThat(result.getLastMessageAt()).isNull();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ChatMember>> captor =
                ArgumentCaptor.forClass(List.class);

        then(chatMemberRepository).should().saveAll(captor.capture());

        List<ChatMember> members = captor.getValue();

        assertThat(members).hasSize(2);
        assertThat(members)
                .extracting(ChatMember::getUser)
                .containsExactly(currentUser, targetUser);
        assertThat(members)
                .allSatisfy(member -> assertThat(member.getChat()).isSameAs(result));
    }
}