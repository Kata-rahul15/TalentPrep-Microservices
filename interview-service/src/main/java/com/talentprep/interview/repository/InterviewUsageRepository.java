package com.talentprep.interview.repository;

import com.talentprep.interview.entity.InterviewUsage;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewUsageRepository extends JpaRepository<InterviewUsage, UUID> {

    Optional<InterviewUsage> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM InterviewUsage u WHERE u.userId = :userId")
    Optional<InterviewUsage> findByUserIdForUpdate(@Param("userId") UUID userId);
}

