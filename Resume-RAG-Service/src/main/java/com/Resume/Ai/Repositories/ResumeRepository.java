package com.Resume.Ai.Repositories;

import com.Resume.Ai.Entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, UUID> {

    Optional<Resume> findById(UUID id);

    List<Resume> findAllByUserId(UUID userId);

    Optional<Resume> findFirstByUserIdAndActiveTrueOrderByCreatedAtDesc(UUID userId);

    Optional<Resume> findByUserIdAndActiveTrue(UUID userId);

    boolean existsByUserId(UUID userId);

    @Modifying
    @Query("""
    UPDATE Resume r
    SET r.active = false
    WHERE r.userId = :userId
      AND r.active = true
""")
    int deactivateActiveResumes(
            @Param("userId") UUID userId
    );
}