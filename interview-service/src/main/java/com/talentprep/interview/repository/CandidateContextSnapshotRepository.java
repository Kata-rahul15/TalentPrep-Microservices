package com.talentprep.interview.repository;

import com.talentprep.interview.entity.CandidateContextSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateContextSnapshotRepository extends JpaRepository<CandidateContextSnapshot, UUID> {

    Optional<CandidateContextSnapshot> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<CandidateContextSnapshot> findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(UUID userId, UUID resumeId);

    Optional<CandidateContextSnapshot> findFirstByUserIdAndResumeIdIsNullOrderByCreatedAtDesc(UUID userId);
}

