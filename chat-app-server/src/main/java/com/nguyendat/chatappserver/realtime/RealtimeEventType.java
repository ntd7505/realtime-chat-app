package com.nguyendat.chatappserver.realtime;

public final class RealtimeEventType {

  public static final String MESSAGE_ACK = "message.ack";
  public static final String MESSAGE_REJECTED = "message.rejected";
  public static final String CHAT_UPDATED = "chat.updated";
  public static final String FRIENDSHIP_REQUESTED = "friendship.requested";
  public static final String FRIENDSHIP_ACCEPTED = "friendship.accepted";
  public static final String FRIENDSHIP_DELETED = "friendship.deleted";
  public static final String READ_UPDATED = "read.updated";
  public static final String MESSAGE_READ = "message.read";

  private RealtimeEventType() {}
}
