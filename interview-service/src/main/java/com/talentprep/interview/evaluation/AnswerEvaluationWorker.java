package com.talentprep.interview.evaluation;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.AnswerEvaluation;
import com.talentprep.interview.entity.InterviewAnswer;
import com.talentprep.interview.repository.InterviewAnswerRepository;
import com.talentprep.interview.session.QuestionFlowCoordinator;
import com.talentprep.interview.session.AsyncInterviewTaskStateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
public class AnswerEvaluationWorker {

    private static final Logger log = LoggerFactory.getLogger(AnswerEvaluationWorker.class);

    private final AnswerEvaluationService evaluationService;
    private final InterviewAnswerRepository answerRepository;
    private final AsyncInterviewTaskStateService taskStateService;
    private final QuestionFlowCoordinator coordinator;

    public AnswerEvaluationWorker(
            AnswerEvaluationService evaluationService,
            InterviewAnswerRepository answerRepository,
            AsyncInterviewTaskStateService taskStateService,
            QuestionFlowCoordinator coordinator) {
        this.evaluationService = evaluationService;
        this.answerRepository = answerRepository;
        this.taskStateService = taskStateService;
        this.coordinator = coordinator;
    }

    @Async("evaluationExecutor")
    @Transactional
    public void processEvaluationAsync(
            UUID taskId,
            UUID answerId,
            CandidateContext context,
            List<ConversationTurn> history) {

        log.info("Starting asynchronous answer evaluation: taskId={}, answerId={}", taskId, answerId);

        try {
            taskStateService.markRunning(taskId);
            InterviewAnswer answer = answerRepository.findById(answerId)
                    .orElseThrow(() -> new IllegalArgumentException("Answer not found: " + answerId));

            // Execute Spring AI evaluation
            AnswerEvaluation evaluation = evaluationService.evaluateAndSave(answer, context, history);

            answer.setEvaluationStatus("COMPLETED");
            answerRepository.save(answer);
            UUID evaluatedQuestionId = answer.getQuestion().getId();
            afterCommit(() -> {
                coordinator.publishEvaluation(answerId, evaluatedQuestionId, evaluation);
                taskStateService.markCompleted(taskId);
            });
            log.info("Successfully completed asynchronous evaluation: taskId={}, answerId={}", taskId, answerId);
        } catch (Exception ex) {
            log.error("Failed asynchronous answer evaluation: taskId={}, answerId={}", taskId, answerId, ex);
            coordinator.publishError(
                    answerRepository.findById(answerId).map(a -> a.getQuestion().getId()).orElse(null),
                    "ANSWER_EVALUATION_FAILED", ex.getMessage());
            taskStateService.markFailed(taskId, ex);
        }
    }
    private void afterCommit(Runnable action) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override public void afterCommit() { action.run(); }
                    });
        } else {
            action.run();
        }
    }
}

