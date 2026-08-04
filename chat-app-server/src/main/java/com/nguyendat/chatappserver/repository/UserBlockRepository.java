package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

  boolean existsByBlockerIdAndBlockedUserId(Long blockerId, Long blockedUserId);
}
