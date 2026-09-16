package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.Message;
import com.nguyendat.chatappserver.repository.projection.ChatUnreadCount;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

  @Query(
      """
                    SELECT message
                    FROM Message message
                    JOIN FETCH message.sender
                    WHERE message.chat.id = :chatId
                    AND(
                        :beforeMessageId IS NULL
                        OR message.id < :beforeMessageId
                    )
                    ORDER BY message.id DESC
                    """)
  List<Message> findMessageHistory(
      @Param("chatId") Long chatId,
      @Param("beforeMessageId") Long beforeMessageId,
      Pageable pageable);

  @EntityGraph(attributePaths = {"sender", "chat"})
  Optional<Message> findMessageBySender_IdAndClientMessageId(Long senderId, UUID clientMessageId);

  boolean existsByIdAndChat_Id(Long messageId, Long chatId);

  Optional<Message> findByIdAndChat_Id(Long messageId, Long chatId);

  @Query(
      """
      SELECT message
      FROM Message message
      JOIN FETCH message.sender
      WHERE message.chat.id = :chatId
        AND message.id > :afterMessageId
      ORDER BY message.id ASC
      """)
  List<Message> findMessagesAfter(
      @Param("chatId") Long chatId,
      @Param("afterMessageId") Long afterMessageId,
      Pageable pageable);

  @Query(
      value =
          """
          SELECT message.chat_id AS "chatId", COUNT(*) AS "unreadCount"
          FROM messages message
          JOIN chat_members member
            ON member.chat_id = message.chat_id
           AND member.user_id = :userId
          WHERE message.chat_id IN (:chatIds)
            AND message.sender_id <> :userId
            AND (
              member.last_read_message_id IS NULL
              OR message.id > member.last_read_message_id
            )
          GROUP BY message.chat_id
          """,
      nativeQuery = true)
  List<ChatUnreadCount> countUnreadMessages(
      @Param("userId") Long userId, @Param("chatIds") List<Long> chatIds);

  @EntityGraph(attributePaths = "sender")
  Optional<Message> findFirstByChat_IdOrderByIdDesc(Long chatId);

  @Query(
      """
                    SELECT message
                    FROM Message message
                    JOIN FETCH message.sender
                    WHERE message.id IN (
                    SELECT MAX(candidate.id)
                    FROM Message candidate
                    WHERE candidate.chat.id IN :chatIds
                    GROUP BY candidate.chat.id
                    )
            """)
  List<Message> findLatestMessagesByChatIds(@Param("chatIds") List<Long> chatIds);
}
