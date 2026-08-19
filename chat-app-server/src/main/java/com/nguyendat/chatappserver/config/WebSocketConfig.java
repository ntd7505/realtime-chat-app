package com.nguyendat.chatappserver.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final WebSocketAuthChannelInterceptor authInterceptor;

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry
        .addEndpoint("/ws")
        .setAllowedOriginPatterns("*") // production: whitelist domain cụ thể
        .withSockJS(); // fallback cho trình duyệt/network chặn WS
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    // client subscribe vào các topic bắt đầu bằng /topic hoặc /queue
    registry.enableSimpleBroker("/topic", "/queue");
    // message client gửi lên server sẽ có prefix /app
    registry.setApplicationDestinationPrefixes("/app");
    // prefix riêng cho tin nhắn cá nhân (point-to-point)
    registry.setUserDestinationPrefix("/user");
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(authInterceptor);
  }
}
