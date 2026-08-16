package com.nguyendat.chatappserver.mapper;

import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.model.Message;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR,
    uses = UserMapper.class)
public interface MessageMapper {

  MessageResponse toMessageResponse(Message message);
}
