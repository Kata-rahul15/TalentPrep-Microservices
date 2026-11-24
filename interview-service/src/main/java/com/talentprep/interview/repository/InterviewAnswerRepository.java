package com.talentprep.interview.repository;

import com.talentprep.interview.entity.InterviewAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, UUID> {

    Optional<InterviewAnswer> findByQuestionId(UUID questionId);

    Optional<InterviewAnswer> findByQuestionIdAndClientRequestId(UUID questionId, String clientRequestId);
}

