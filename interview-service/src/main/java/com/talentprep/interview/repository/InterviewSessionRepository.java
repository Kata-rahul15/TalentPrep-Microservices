package com.talentprep.interview.repository;

import com.talentprep.interview.entity.InterviewSession;
import com.talentprep.interview.entity.enums.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {

    List<InterviewSession> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT s FROM InterviewSession s LEFT JOIN FETCH s.rounds WHERE s.id = :id")
    Optional<InterviewSession> findByIdWithRounds(@Param("id") UUID id);

    @Query("SELECT s FROM InterviewSession s LEFT JOIN FETCH s.snapshot WHERE s.id = :id")
    Optional<InterviewSession> findByIdWithSnapshot(@Param("id") UUID id);

    Optional<InterviewSession> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);

    long countByUserIdAndStatus(UUID userId, InterviewStatus status);
}

