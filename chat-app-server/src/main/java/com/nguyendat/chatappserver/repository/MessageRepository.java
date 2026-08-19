package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.Message;
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

  @EntityGraph(attributePaths = "sender")
  Optional<Message> findMessageBySender_IdAndClientMessageId(Long senderId, UUID clientMessageId);

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
