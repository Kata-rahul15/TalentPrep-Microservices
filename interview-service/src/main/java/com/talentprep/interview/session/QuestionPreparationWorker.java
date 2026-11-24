package com.talentprep.interview.session;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.InterviewRound;
import com.talentprep.interview.entity.InterviewSession;
import com.talentprep.interview.repository.InterviewQuestionRepository;
import com.talentprep.interview.repository.InterviewRoundRepository;
import com.talentprep.interview.repository.InterviewSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class QuestionPreparationWorker {

    private static final Logger log = LoggerFactory.getLogger(QuestionPreparationWorker.class);

    private final InterviewSessionRepository sessionRepository;
    private final InterviewRoundRepository roundRepository;
    private final InterviewQuestionRepository questionRepository;
    private final InterviewQuestionService questionService;
    private final QuestionFlowCoordinator coordinator;
    private final AsyncInterviewTaskStateService taskStateService;

    public QuestionPreparationWorker(
            InterviewSessionRepository sessionRepository,
            InterviewRoundRepository roundRepository,
            InterviewQuestionRepository questionRepository,
            InterviewQuestionService questionService,
            QuestionFlowCoordinator coordinator,
            AsyncInterviewTaskStateService taskStateService) {
        this.sessionRepository = sessionRepository;
        this.roundRepository = roundRepository;
        this.questionRepository = questionRepository;
        this.questionService = questionService;
        this.coordinator = coordinator;
        this.taskStateService = taskStateService;
    }

    @Async("questionExecutor")
    public void prepareNextMainQuestionAsync(
            UUID taskId,
            UUID sessionId,
            UUID roundId,
            UUID rootQuestionId,
            CandidateContext context,
            List<ConversationTurn> history) {
        try {
            taskStateService.markRunning(taskId);
            if (questionRepository.existsByPreparedForQuestionId(rootQuestionId)) {
                coordinator.onMainQuestionPrepared(rootQuestionId);
                taskStateService.markCompleted(taskId);
                return;
            }

            InterviewSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new IllegalStateException("Interview session not found: " + sessionId));
            InterviewRound round = roundRepository.findById(roundId)
                    .orElseThrow(() -> new IllegalStateException("Interview round not found: " + roundId));

            questionService.prepareNextMainQuestion(session, round, context, history, rootQuestionId);
            coordinator.onMainQuestionPrepared(rootQuestionId);
            taskStateService.markCompleted(taskId);
            log.info("Prepared next main question for root question {}", rootQuestionId);
        } catch (Exception ex) {
            log.error("Next main question preparation failed for root question {}", rootQuestionId, ex);
            taskStateService.markFailed(taskId, ex);
            if (questionRepository.existsByPreparedForQuestionId(rootQuestionId)) {
                coordinator.onMainQuestionPrepared(rootQuestionId);
            } else {
                coordinator.publishError(rootQuestionId, "NEXT_QUESTION_PREPARATION_FAILED", ex.getMessage());
            }
        }
    }

}
