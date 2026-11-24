package com.talentprep.interview.repository;

import com.talentprep.interview.entity.AsyncInterviewTask;
import com.talentprep.interview.entity.enums.TaskStatus;
import com.talentprep.interview.entity.enums.TaskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AsyncInterviewTaskRepository extends JpaRepository<AsyncInterviewTask, UUID> {

    Optional<AsyncInterviewTask> findByAnswerIdAndTaskType(UUID answerId, TaskType taskType);

    List<AsyncInterviewTask> findAllBySessionId(UUID sessionId);

    List<AsyncInterviewTask> findAllBySessionIdAndStatus(UUID sessionId, TaskStatus status);

    List<AsyncInterviewTask> findByStatus(TaskStatus status);

    @Query("SELECT t FROM AsyncInterviewTask t WHERE t.status = :status AND t.updatedAt < :threshold")
    List<AsyncInterviewTask> findStaleTasks(
            @Param("status") TaskStatus status,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("SELECT t FROM AsyncInterviewTask t WHERE t.status IN ('PENDING', 'RUNNING') AND t.updatedAt < :threshold AND t.attemptCount < t.maxAttempts")
    List<AsyncInterviewTask> findRecoverableTasks(@Param("threshold") LocalDateTime threshold);
}

