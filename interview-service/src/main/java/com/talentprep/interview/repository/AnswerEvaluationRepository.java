package com.talentprep.interview.repository;

import com.talentprep.interview.entity.AnswerEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnswerEvaluationRepository extends JpaRepository<AnswerEvaluation, UUID> {

    Optional<AnswerEvaluation> findByAnswerId(UUID answerId);
}

