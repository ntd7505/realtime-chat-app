package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.model.UserBlock;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

  boolean existsByBlockerIdAndBlockedUserId(Long blockerId, Long blockedUserId);

  @Modifying
  @Query(
      """
                    DELETE FROM UserBlock userBlock
                    WHERE userBlock.blocker.id = :blockerId
                      AND userBlock.blockedUser.id = :blockedUserId
                    """)
  int deleteBlock(@Param("blockerId") Long blockerId, @Param("blockedUserId") Long blockedUserId);

  @Query(
      """
                    SELECT userBlock
                    FROM UserBlock userBlock
                    JOIN FETCH userBlock.blockedUser
                    WHERE userBlock.blocker.id = :blockerId
                    ORDER BY userBlock.createdAt DESC
                    """)
  List<UserBlock> findAllBlockedUsers(@Param("blockerId") Long blockerId);

  @Query(
      """
            SELECT COUNT(userBlock) > 0
            FROM UserBlock userBlock
            WHERE (
                    userBlock.blocker.id = :firstUserId
                    AND userBlock.blockedUser.id = :secondUserId
                  )
               OR (
                    userBlock.blocker.id = :secondUserId
                    AND userBlock.blockedUser.id = :firstUserId
                  )
            """)
  boolean existsBlockBetween(
      @Param("firstUserId") Long firstUserId, @Param("secondUserId") Long secondUserId);
}
