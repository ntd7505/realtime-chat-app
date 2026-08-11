package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.Chat;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

  Optional<Chat> findByDirectKey(String directKey);
}
