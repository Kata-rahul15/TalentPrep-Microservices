package com.talentprep.interview.session;

import com.talentprep.interview.entity.AsyncInterviewTask;
import com.talentprep.interview.entity.enums.TaskStatus;
import com.talentprep.interview.repository.AsyncInterviewTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AsyncInterviewTaskStateService {

    private final AsyncInterviewTaskRepository repository;

    public AsyncInterviewTaskStateService(AsyncInterviewTaskRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markRunning(UUID taskId) {
        update(taskId, TaskStatus.RUNNING, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCompleted(UUID taskId) {
        update(taskId, TaskStatus.COMPLETED, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(UUID taskId, Exception error) {
        update(taskId, TaskStatus.FAILED, error);
    }

    private void update(UUID taskId, TaskStatus status, Exception error) {
        if (taskId == null) return;
        AsyncInterviewTask task = repository.findById(taskId).orElse(null);
        if (task == null) return;

        if (status == TaskStatus.RUNNING) {
            task.setStartedAt(LocalDateTime.now());
            task.setAttemptCount(task.getAttemptCount() == null ? 1 : task.getAttemptCount() + 1);
        }
        if (status == TaskStatus.COMPLETED || status == TaskStatus.FAILED) {
            task.setCompletedAt(LocalDateTime.now());
        }
        task.setStatus(status);
        if (error != null) {
            task.setLastErrorCode(error.getClass().getSimpleName());
            String message = error.getMessage();
            task.setLastErrorMessage(message == null ? "Background task failed." :
                    (message.length() > 500 ? message.substring(0, 500) : message));
        }
        repository.save(task);
    }
}
