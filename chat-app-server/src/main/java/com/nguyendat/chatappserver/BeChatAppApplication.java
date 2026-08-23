package com.nguyendat.chatappserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BeChatAppApplication {

  public static void main(String[] args) {
    SpringApplication.run(BeChatAppApplication.class, args);
  }
}
