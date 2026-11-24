package com.talentprep.interview.agent;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.dto.FollowUpDecisionResponse;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.InterviewQuestion;
import com.talentprep.interview.entity.InterviewRound;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.QuestionStatus;
import com.talentprep.interview.session.AsyncInterviewTaskStateService;
import com.talentprep.interview.repository.InterviewQuestionRepository;
import com.talentprep.interview.repository.InterviewRoundRepository;
import com.talentprep.interview.session.QuestionFlowCoordinator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;

@Component
public class FollowUpDecisionWorker {

    private static final Logger log = LoggerFactory.getLogger(FollowUpDecisionWorker.class);

    private final FollowUpGenerationService followUpService;
    private final InterviewQuestionRepository questionRepository;
    private final AsyncInterviewTaskStateService taskStateService;
    private final QuestionFlowCoordinator coordinator;
    private final InterviewRoundRepository roundRepository;

    public FollowUpDecisionWorker(
            FollowUpGenerationService followUpService,
            InterviewQuestionRepository questionRepository,
            AsyncInterviewTaskStateService taskStateService,
            QuestionFlowCoordinator coordinator,
            InterviewRoundRepository roundRepository) {
        this.followUpService = followUpService;
        this.questionRepository = questionRepository;
        this.taskStateService = taskStateService;
        this.coordinator = coordinator;
        this.roundRepository = roundRepository;
    }

    @Async("followUpExecutor")
    @Transactional
    public void processFollowUpAsync(
            UUID taskId,
            UUID answerId,
            UUID questionId,
            String answerText,
            CandidateContext context,
            List<ConversationTurn> history,
            long remainingSeconds,
            DifficultyLevel difficulty) {

        try {
            taskStateService.markRunning(taskId);

            InterviewQuestion current = questionRepository.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("Question not found: " + questionId));
            InterviewRound round = current.getRound();
            UUID rootId = current.getParentQuestionId() != null
                    ? current.getParentQuestionId() : current.getId();
            InterviewQuestion root = questionRepository.findById(rootId)
                    .orElseThrow(() -> new IllegalArgumentException("Root question not found: " + rootId));
            // A retried durable task must not create a second follow-up for the same answer.
            InterviewQuestion alreadyGenerated = questionRepository.findByTriggeringAnswerId(answerId).orElse(null);
            if (alreadyGenerated != null) {
                if (alreadyGenerated.getQuestionStatus() == QuestionStatus.READY) {
                    UUID existingFollowUpId = alreadyGenerated.getId();
                    afterCommit(() -> coordinator.deliverFollowUp(existingFollowUpId));
                }
                afterCommit(() -> taskStateService.markCompleted(taskId));
                return;
            }

            int depth = current.getDepth() == null ? 0 : current.getDepth();
            int followUpCount = questionRepository.countByParentQuestionId(rootId);
            String expectedAnswer = null;
            if (current.getAnswer() != null && current.getAnswer().getEvaluation() != null) {
                expectedAnswer = current.getAnswer().getEvaluation().getSuggestedIdealAnswer();
            }

            FollowUpDecisionResponse decision = followUpService.decideFollowUp(
                    round.getRoundType(), current.getQuestionText(), answerText, expectedAnswer, context, history,
                    depth, followUpCount, remainingSeconds, difficulty);

            String selected = decision == null || decision.getDecision() == null
                    ? "MOVE_ON" : decision.getDecision().trim().toUpperCase();
            if ("CLARIFY".equals(selected)) selected = "ASK_FOLLOW_UP";

            if ("ASK_FOLLOW_UP".equals(selected)
                    && followUpCount < 2
                    && depth < 2
                    && decision.getQuestion() != null
                    && !decision.getQuestion().isBlank()) {

                InterviewRound lockedRound = roundRepository.findByIdForUpdate(round.getId()).orElse(round);
                int nextOrder = questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(round.getId()).size() + 1;
                InterviewQuestion followUp = InterviewQuestion.builder()
                        .round(lockedRound)
                        .parentQuestionId(rootId)
                        .triggeringAnswerId(answerId)
                        .depth(depth + 1)
                        .topic(decision.getTopic())
                        .questionOrder(nextOrder)
                        .questionText(decision.getQuestion())
                        .questionCategory(current.getQuestionCategory())
                        .difficulty(current.getDifficulty())
                        .isFollowUp(true)
                        .questionStatus(QuestionStatus.READY)
                        .build();
                followUp = questionRepository.saveAndFlush(followUp);
                root.setFollowUpDecision("ASK_FOLLOW_UP");
                questionRepository.saveAndFlush(root);
                UUID savedFollowUpId = followUp.getId();
                afterCommit(() -> coordinator.deliverFollowUp(savedFollowUpId));
                log.info("Persisted follow-up {} for root {}", savedFollowUpId, rootId);
            } else {
                // Any invalid/unsupported decision moves on. Deliver after this transaction commits.
                root.setFollowUpDecision("MOVE_ON");
                questionRepository.saveAndFlush(root);
                afterCommit(() -> coordinator.resolveRootDecision(rootId, "MOVE_ON"));
                log.info("Follow-up decision resolved to MOVE_ON for root {}", rootId);
            }

            afterCommit(() -> taskStateService.markCompleted(taskId));
        } catch (Exception ex) {
            log.error("Follow-up decision worker failed for task {} / question {}", taskId, questionId, ex);
            taskStateService.markFailed(taskId, ex);
            // A failed follow-up branch must never strand the candidate. The prepared-question
            // worker may still be running; the coordinator will deliver it when it commits.
            try {
                InterviewQuestion current = questionRepository.findById(questionId).orElse(null);
                if (current != null) {
                    UUID rootId = current.getParentQuestionId() != null
                            ? current.getParentQuestionId() : current.getId();
                    coordinator.resolveRootDecision(rootId, "MOVE_ON");
                }
            } catch (Exception recoveryEx) {
                log.error("Unable to recover interview flow after follow-up failure for {}", questionId, recoveryEx);
                coordinator.publishError(questionId, "FOLLOW_UP_FAILED", recoveryEx.getMessage());
            }
        }
    }

    private void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

}
