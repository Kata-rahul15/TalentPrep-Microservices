package com.Resume.Ai.Repositories;

import com.Resume.Ai.Entity.ResumeChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResumeChunkRepository extends JpaRepository<ResumeChunk, UUID> {

    List<ResumeChunk> findAllByResumeId(UUID resumeId);

    void deleteAllByResumeId(UUID resumeId);
}
