package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.Chat;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

  Optional<Chat> findByDirectKey(String directKey);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query(
      """
                    SELECT chat
                    FROM Chat chat
                    WHERE chat.id = :chatId
                    """)
  Optional<Chat> findByIdForUpdate(@Param("chatId") Long chatId);
}
