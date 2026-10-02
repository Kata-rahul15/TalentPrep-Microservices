package com.Resume.Ai.Repositories;

import com.Resume.Ai.Entity.ResumeEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeEvaluationRepository extends JpaRepository<ResumeEvaluation, UUID> {

    Optional<ResumeEvaluation> findByResume_Id(UUID resumeId);
}
