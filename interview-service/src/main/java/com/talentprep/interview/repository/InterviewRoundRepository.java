package com.talentprep.interview.repository;

import com.talentprep.interview.entity.InterviewRound;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewRoundRepository extends JpaRepository<InterviewRound, UUID> {

    List<InterviewRound> findAllBySessionIdOrderByRoundOrderAsc(UUID sessionId);

    @Query("SELECT r FROM InterviewRound r LEFT JOIN FETCH r.questions WHERE r.id = :id")
    Optional<InterviewRound> findByIdWithQuestions(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM InterviewRound r WHERE r.id = :id")
    Optional<InterviewRound> findByIdForUpdate(@Param("id") UUID id);
}

