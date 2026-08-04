package com.nguyendat.chatappserver.repository;

import com.nguyendat.chatappserver.enums.FriendshipStatus;
import com.nguyendat.chatappserver.model.Friendship;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
  @Query(
      """
                    SELECT f
                    FROM Friendship f
                    WHERE (f.requester.id = :firstUserId AND f.recipient.id = :secondUserId)
                       OR (f.requester.id = :secondUserId AND f.recipient.id = :firstUserId)
                    """)
  Optional<Friendship> findRelationshipBetween(
      @Param("firstUserId") Long firstUserId, @Param("secondUserId") Long secondUserId);

  @Modifying
  @Query(
      """
                    DELETE FROM Friendship friendship
                    WHERE friendship.status = :status
                      AND (
                            (friendship.requester.id = :firstUserId
                             AND friendship.recipient.id = :secondUserId)
                         OR (friendship.requester.id = :secondUserId
                             AND friendship.recipient.id = :firstUserId)
                      )
                    """)
  int deleteFriendRequest(
      @Param("firstUserId") Long firstUserId,
      @Param("secondUserId") Long secondUserId,
      @Param("status") FriendshipStatus status);

  @Modifying
  @Query(
      """
                    DELETE FROM Friendship friendship
                    WHERE friendship.status = :status
                      AND (
                            (friendship.requester.id = :firstUserId
                             AND friendship.recipient.id = :secondUserId)
                         OR (friendship.requester.id = :secondUserId
                             AND friendship.recipient.id = :firstUserId)
                      )
                    """)
  int unfriend(
      @Param("firstUserId") Long firstUserId,
      @Param("secondUserId") Long secondUserId,
      @Param("status") FriendshipStatus status);

  @Query(
      """
                    SELECT friendship
                    FROM Friendship friendship
                    JOIN FETCH friendship.requester
                    JOIN FETCH friendship.recipient
                    WHERE friendship.status = :status
                      AND (
                            friendship.requester.id = :currentUserId
                            OR friendship.recipient.id = :currentUserId
                      )
                    ORDER BY friendship.updatedAt DESC
                    """)
  List<Friendship> findAllFriendshipsOfUser(
      @Param("currentUserId") Long currentUserId, @Param("status") FriendshipStatus status);

  Optional<Friendship> findFriendshipByRequester_IdAndRecipient_Id(
      Long requesterId, Long Recipient_id);

  @Query(
      """
                    SELECT friendship
                    FROM Friendship friendship
                    JOIN FETCH friendship.requester
                    WHERE friendship.recipient.id = :currentUserId
                      AND friendship.status = :status
                    ORDER BY friendship.createdAt DESC
                    """)
  List<Friendship> findAllReceivedRequests(
      @Param("currentUserId") Long currentUserId, @Param("status") FriendshipStatus status);
}
