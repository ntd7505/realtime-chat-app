package com.nguyendat.chatappserver.service.impl;

import com.nguyendat.chatappserver.enums.ChatType;
import com.nguyendat.chatappserver.mapper.ChatMapper;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.ChatMember;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.ChatRepository;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DirectChatCreator {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatMapper chatMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Chat create(User currentUser, User targetUser, String directKey) {
        Chat chat = new Chat();
        chat.setDirectKey(directKey);
        chat.setType(ChatType.DIRECT);
        chat.setLastMessageAt(null);

        Chat savedChat = chatRepository.saveAndFlush(chat);

        ChatMember currentUserMember = new ChatMember();
        currentUserMember.setChat(savedChat);
        currentUserMember.setUser(currentUser);

        ChatMember targetUserMember = new ChatMember();
        targetUserMember.setChat(savedChat);
        targetUserMember.setUser(targetUser);

        chatMemberRepository.saveAll(List.of(currentUserMember, targetUserMember));
        return savedChat;
    }
}
