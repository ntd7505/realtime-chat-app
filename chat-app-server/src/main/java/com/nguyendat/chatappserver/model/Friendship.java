package com.nguyendat.chatappserver.model;

import com.nguyendat.chatappserver.enums.FriendshipStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(
    name = "friendships",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_friendship_requester_recipient",
          columnNames = {"requester_id", "recipient_id"})
    })
public class Friendship {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "requester_id", nullable = false)
  User requester;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "recipient_id", nullable = false)
  User recipient;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  FriendshipStatus status;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  LocalDateTime updatedAt;
}
