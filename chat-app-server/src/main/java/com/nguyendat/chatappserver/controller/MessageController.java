package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.request.SendMessageRequest;
import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.dto.response.MessageResponse;
import com.nguyendat.chatappserver.dto.response.MessageSyncResponse;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.MessageService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chats")
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class MessageController {

  MessageService messageService;

  @GetMapping("/{chatId}/messages")
  public ResponseEntity<ApiResponse<CursorPageResponse<MessageResponse>>> getMessageHistory(
      @AuthenticationPrincipal User currentUser,
      @PathVariable Long chatId,
      @RequestParam(required = false) String cursor,
      @RequestParam(defaultValue = "30") int limit) {

    CursorPageResponse<MessageResponse> result =
        messageService.getMessageHistory(currentUser, chatId, cursor, limit);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.MESSAGE_HISTORY_RETRIEVED, result));
  }

  @PostMapping("/{chatId}/messages")
  public ResponseEntity<ApiResponse<MessageResponse>> sendMessages(
      @Valid @RequestBody SendMessageRequest request,
      @PathVariable Long chatId,
      @AuthenticationPrincipal User currentUser) {

    var rs = messageService.sendMessage(request, chatId, currentUser);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.MESSAGE_SENT, rs.message()));
  }

  @GetMapping("/{chatId}/messages/sync")
  public ResponseEntity<ApiResponse<MessageSyncResponse>> syncMessages(
      @AuthenticationPrincipal User currentUser,
      @PathVariable Long chatId,
      @RequestParam Long afterMessageId,
      @RequestParam(defaultValue = "100") int limit) {
    MessageSyncResponse result =
        messageService.getMessagesAfter(currentUser, chatId, afterMessageId, limit);
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.MESSAGES_SYNCHRONIZED, result));
  }
}
