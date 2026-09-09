package com.nguyendat.chatappserver.config;

import com.nguyendat.chatappserver.model.User;
import com.nguyendat.chatappserver.repository.ChatMemberRepository;
import com.nguyendat.chatappserver.repository.UserRepository;
import com.nguyendat.chatappserver.service.impl.JwtService;
import com.nguyendat.chatappserver.websocket.WebSocketPrincipal;
import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

  private static final Pattern CHAT_TOPIC_PATTERN = Pattern.compile("^/topic/chats/(\\d+)$");

  private static final Pattern CHAT_SEND_PATTERN = Pattern.compile("^/app/chats/(\\d+)/messages$");
  private static final String USER_EVENTS_DESTINATION = "/user/queue/events";
  private static final String USER_MESSAGE_EVENTS_DESTINATION = "/user/queue/message-events";

  private final JwtService jwtService;
  private final UserRepository userRepository;
  private final ChatMemberRepository chatMemberRepository;

  @Override
  public @Nullable Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor =
        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

    if (accessor == null) {
      return message;
    }

    StompCommand command = accessor.getCommand();
    log.info("Processing STOMP {} for session {}", command, accessor.getSessionId());

    if (command == null) {
      return message;
    }

    if (StompCommand.CONNECT.equals(command)) {
      authenticate(accessor);
      return message;
    }

    if (StompCommand.SEND.equals(command)) {
      authorizeSend(accessor);
      return message;
    }

    if (StompCommand.SUBSCRIBE.equals(command)) {
      authorizeSubscribe(accessor);
      return message;
    }

    return message;
  }

  private void authenticate(StompHeaderAccessor accessor) {
    String authorization = accessor.getFirstNativeHeader("Authorization");

    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new MessageDeliveryException("Authorization header is missing");
    }

    String token = authorization.substring(7);

    if (!jwtService.isValid(token)) {
      throw new MessageDeliveryException("Invalid JWT token");
    }

    Long userId = jwtService.extractUserId(token);

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new MessageDeliveryException("User not found"));

    accessor.setUser(new WebSocketPrincipal(user));
  }

  private void authorizeSend(StompHeaderAccessor accessor) {
    getCurrentUser(accessor);
    String destination = accessor.getDestination();

    if (destination == null) {
      throw new MessageDeliveryException("Destination is missing");
    }

    Matcher matcher = CHAT_SEND_PATTERN.matcher(destination);

    if (!matcher.matches()) {
      throw new MessageDeliveryException("Invalid send destination");
    }
  }

  private void authorizeSubscribe(StompHeaderAccessor accessor) {
    User currentUser = getCurrentUser(accessor);

    String destination = accessor.getDestination();

    if (destination == null) {
      throw new MessageDeliveryException("Destination is missing");
    }

    if (USER_EVENTS_DESTINATION.equals(destination)
        || USER_MESSAGE_EVENTS_DESTINATION.equals(destination)) {
      return;
    }

    Matcher matcher = CHAT_TOPIC_PATTERN.matcher(destination);

    if (!matcher.matches()) {
      throw new MessageDeliveryException("Invalid subscription destination");
    }

    Long chatId = Long.valueOf(matcher.group(1));

    boolean isMember = chatMemberRepository.existsByChat_IdAndUser_Id(chatId, currentUser.getId());

    if (!isMember) {
      throw new MessageDeliveryException("User is not a member of this chat");
    }
  }

  private User getCurrentUser(StompHeaderAccessor accessor) {

    Principal principal = accessor.getUser();

    if (!(principal instanceof WebSocketPrincipal websocketPrincipal)) {
      throw new MessageDeliveryException("Invalid WebSocket principal");
    }

    return websocketPrincipal.user();
  }
}
