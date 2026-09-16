package com.nguyendat.chatappserver.mapper;

import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR,
    uses = {UserMapper.class, MessageMapper.class})
public interface ChatMapper {

  @Mapping(target = "id", source = "chat.id")
  @Mapping(target = "type", source = "chat.type")
  @Mapping(target = "otherUser", source = "otherUser")
  @Mapping(target = "lastMessageAt", source = "chat.lastMessageAt")
  @Mapping(target = "lastMessage", source = "lastMessage")
  @Mapping(target = "unreadCount", source = "unreadCount")
  @Mapping(target = "createdAt", source = "chat.createdAt")
  ChatResponse toChatResponse(Chat chat, User otherUser, Message lastMessage, long unreadCount);
}
