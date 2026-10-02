package com.Resume.Ai.Repositories;

import com.Resume.Ai.Entity.ResumeSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeSectionRepository extends JpaRepository<ResumeSection, UUID> {

    Optional<ResumeSection> findByResume_Id(UUID resumeId);

}
