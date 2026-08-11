package com.nguyendat.chatappserver.mapper;

import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.model.Chat;
import com.nguyendat.chatappserver.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR,
    uses = UserMapper.class)
public interface ChatMapper {

  @Mapping(target = "id", source = "chat.id")
  @Mapping(target = "type", source = "chat.type")
  @Mapping(target = "otherUser", source = "user")
  @Mapping(target = "lastMessageAt", source = "chat.lastMessageAt")
  @Mapping(target = "createdAt", source = "chat.createdAt")
  ChatResponse toChatResponse(Chat chat, User user);
}
