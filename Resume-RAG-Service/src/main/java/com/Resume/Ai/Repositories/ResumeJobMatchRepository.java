package com.Resume.Ai.Repositories;

import com.Resume.Ai.Entity.ResumeJobMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResumeJobMatchRepository extends JpaRepository<ResumeJobMatch, UUID> {

    List<ResumeJobMatch> findAllByResumeId(UUID resumeId);
}
