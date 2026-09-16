package com.nguyendat.chatappserver.service.result;

import com.nguyendat.chatappserver.dto.response.MessageResponse;

public record SendMessageResult(MessageResponse message, boolean created) {}
