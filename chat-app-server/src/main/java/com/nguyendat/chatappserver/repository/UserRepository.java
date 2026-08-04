package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findUserByEmail(String email);

  boolean existsUserByEmail(String email);

  User findUserById(Long id);

  List<User>
      findTop20ByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByDisplayNameAsc(
          String displayNameKeyword, String emailKeyword);
}
