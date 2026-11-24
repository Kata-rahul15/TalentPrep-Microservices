package com.talentprep.interview.repository;

import com.talentprep.interview.entity.InterviewQuestion;
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
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, UUID> {

    List<InterviewQuestion> findAllByRoundIdOrderByQuestionOrderAsc(UUID roundId);

    @Query("SELECT q FROM InterviewQuestion q LEFT JOIN FETCH q.answer WHERE q.id = :id")
    Optional<InterviewQuestion> findByIdWithAnswer(@Param("id") UUID id);

    @Query("SELECT q FROM InterviewQuestion q JOIN q.round r WHERE r.session.id = :sessionId ORDER BY r.roundOrder ASC, q.questionOrder ASC")
    List<InterviewQuestion> findAllBySessionId(@Param("sessionId") UUID sessionId);

    int countByParentQuestionId(UUID parentQuestionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InterviewQuestion> findFirstByPreparedForQuestionIdAndQuestionStatusOrderByQuestionOrderAsc(
            UUID preparedForQuestionId,
            com.talentprep.interview.entity.enums.QuestionStatus questionStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM InterviewQuestion q WHERE q.id = :id")
    Optional<InterviewQuestion> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByPreparedForQuestionId(UUID preparedForQuestionId);

    Optional<InterviewQuestion> findByTriggeringAnswerId(UUID triggeringAnswerId);
}

