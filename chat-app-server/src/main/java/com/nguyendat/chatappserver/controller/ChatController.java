package com.nguyendat.chatappserver.controller;

import com.nguyendat.chatappserver.dto.request.MarkChatReadRequest;
import com.nguyendat.chatappserver.dto.response.ApiResponse;
import com.nguyendat.chatappserver.dto.response.ChatReadResponse;
import com.nguyendat.chatappserver.dto.response.ChatResponse;
import com.nguyendat.chatappserver.dto.response.CursorPageResponse;
import com.nguyendat.chatappserver.enums.ResponseCode;
import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.service.ChatService;
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
public class ChatController {

  ChatService chatService;

  @PostMapping("/direct/{userId}")
  public ResponseEntity<ApiResponse<ChatResponse>> createOrGetDirectChat(
      @AuthenticationPrincipal User currentUser, @PathVariable Long userId) {
    var result = chatService.createOrGetDirectChat(currentUser, userId);
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.DIRECT_CHAT_RETRIEVED, result));
  }

  @GetMapping
  public ResponseEntity<ApiResponse<CursorPageResponse<ChatResponse>>> getMyChats(
      @AuthenticationPrincipal User currentUser,
      @RequestParam(required = false) String cursor,
      @RequestParam(defaultValue = "20") int limit) {

    CursorPageResponse<ChatResponse> result = chatService.getMyChats(currentUser, cursor, limit);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.CHAT_LIST_RETRIEVED, result));
  }

  @GetMapping("/{chatId}")
  public ResponseEntity<ApiResponse<ChatResponse>> getChatById(
      @AuthenticationPrincipal User currentUser, @PathVariable Long chatId) {

    ChatResponse result = chatService.getChatById(currentUser, chatId);

    return ResponseEntity.ok(ApiResponse.success(ResponseCode.CHAT_RETRIEVED, result));
  }

  @PatchMapping("/{chatId}/read")
  public ResponseEntity<ApiResponse<ChatReadResponse>> markAsRead(
      @AuthenticationPrincipal User currentUser,
      @PathVariable Long chatId,
      @Valid @RequestBody MarkChatReadRequest request) {
    ChatReadResponse result = chatService.markAsRead(currentUser, chatId, request.messageId());
    return ResponseEntity.ok(ApiResponse.success(ResponseCode.CHAT_READ_UPDATED, result));
  }
}
