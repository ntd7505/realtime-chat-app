package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findUserByEmail(String email);

  boolean existsUserByEmail(String email);
}
