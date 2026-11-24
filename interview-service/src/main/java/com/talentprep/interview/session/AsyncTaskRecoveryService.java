package com.talentprep.interview.session;

import com.talentprep.interview.entity.AsyncInterviewTask;
import com.talentprep.interview.entity.enums.TaskStatus;
import com.talentprep.interview.repository.AsyncInterviewTaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AsyncTaskRecoveryService {

    private static final Logger log = LoggerFactory.getLogger(AsyncTaskRecoveryService.class);

    private final AsyncInterviewTaskRepository taskRepository;

    public AsyncTaskRecoveryService(AsyncInterviewTaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("Running startup async interview task recovery sweep...");
        recoverInterruptedTasks();
    }

    @Scheduled(fixedDelay = 30000) // Every 30 seconds
    @Transactional
    public void recoverInterruptedTasks() {
        LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(2);
        List<AsyncInterviewTask> recoverableTasks = taskRepository.findRecoverableTasks(staleThreshold);

        if (recoverableTasks.isEmpty()) {
            return;
        }

        log.info("Found {} stale/recoverable async interview tasks to process", recoverableTasks.size());

        for (AsyncInterviewTask task : recoverableTasks) {
            if (task.getAttemptCount() >= task.getMaxAttempts()) {
                log.warn("Task {} exceeded max attempts ({}); marking as FAILED", task.getId(), task.getMaxAttempts());
                task.setStatus(TaskStatus.FAILED);
                task.setLastErrorCode("MAX_ATTEMPTS_EXCEEDED");
                taskRepository.save(task);
            } else {
                log.info("Re-queuing stale async task: id={}, type={}, attempt={}",
                        task.getId(), task.getTaskType(), task.getAttemptCount());
                task.setStatus(TaskStatus.PENDING);
                taskRepository.save(task);
            }
        }
    }
}

