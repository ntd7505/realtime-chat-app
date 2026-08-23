package com.nguyendat.chatappserver.repository;

import static jakarta.persistence.LockModeType.PESSIMISTIC_WRITE;

import com.nguyendat.chatappserver.model.RefreshToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  @Lock(PESSIMISTIC_WRITE)
  @Query(
      """
            SELECT refreshToken
            FROM RefreshToken refreshToken
            JOIN FETCH refreshToken.user
            WHERE refreshToken.tokenHash = :tokenHash
            """)
  Optional<RefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);
}
