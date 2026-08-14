package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.ChatMember;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {

  @Query(
      """
                    SELECT otherMember
                    FROM ChatMember myMember
                    JOIN ChatMember otherMember
                        ON otherMember.chat.id = myMember.chat.id
                    JOIN FETCH otherMember.chat chat
                    JOIN FETCH otherMember.user
                    WHERE myMember.user.id = :currentUserId
                        AND otherMember.user.id <> :currentUserId
                    AND(
                        :cursorTime IS NULL
                        OR COALESCE(chat.lastMessageAt, chat.createdAt) < :cursorTime
                        OR (
                            COALESCE(chat.lastMessageAt, chat.createdAt) = :cursorTime
                            AND chat.id < :cursorChatId
                                    )
                                )
                    ORDER BY COALESCE(chat.lastMessageAt, chat.createdAt) DESC,
                                 chat.id DESC
                    """)
  List<ChatMember> findDirectChatsByUserId(
      @Param("currentUserId") Long currentUserId,
      @Param("cursorTime") LocalDateTime cursorTime,
      @Param("cursorChatId") Long cursorChatId,
      Pageable pageable);

  boolean existsByChat_IdAndUser_Id(Long chatId, Long userId);
}
