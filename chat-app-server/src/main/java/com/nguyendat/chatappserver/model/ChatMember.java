package com.nguyendat.chatappserver.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(
    name = "chat_members",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_chat_members_chat_user",
            columnNames = {"chat_id", "user_id"}))
public class ChatMember {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "chat_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_chat_members_chat"))
  Chat chat;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "user_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_chat_members_user"))
  User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "last_read_message_id",
      foreignKey = @ForeignKey(name = "fk_chat_members_last_read_message"))
  Message lastReadMessage;

  @CreationTimestamp
  @Column(name = "joined_at", nullable = false, updatable = false)
  LocalDateTime joinedAt;
}
