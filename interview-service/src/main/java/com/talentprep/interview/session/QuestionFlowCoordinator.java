package com.talentprep.interview.session;

import com.talentprep.interview.dto.response.InterviewQuestionResponse;
import com.talentprep.interview.entity.InterviewQuestion;
import com.talentprep.interview.entity.AnswerEvaluation;
import com.talentprep.interview.entity.InterviewSession;
import com.talentprep.interview.entity.enums.QuestionStatus;
import com.talentprep.interview.repository.InterviewQuestionRepository;
import com.talentprep.interview.repository.InterviewSessionRepository;
import com.talentprep.interview.websocket.dto.InterviewEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Coordinates the two independent async branches: next-main-question preparation and
 * follow-up decision. A READY main question is delivered only after MOVE_ON is persisted.
 */
@Service
public class QuestionFlowCoordinator {

    private static final Logger log = LoggerFactory.getLogger(QuestionFlowCoordinator.class);

    private final InterviewQuestionRepository questionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionService questionService;
    private final SimpMessagingTemplate messagingTemplate;

    public QuestionFlowCoordinator(
            InterviewQuestionRepository questionRepository,
            InterviewSessionRepository sessionRepository,
            InterviewQuestionService questionService,
            SimpMessagingTemplate messagingTemplate) {
        this.questionRepository = questionRepository;
        this.sessionRepository = sessionRepository;
        this.questionService = questionService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resolveRootDecision(UUID rootQuestionId, String decision) {
        InterviewQuestion root = questionRepository.findByIdForUpdate(rootQuestionId).orElse(null);
        if (root == null) return;
        root.setFollowUpDecision(decision);
        questionRepository.save(root);
        if ("MOVE_ON".equals(decision)) {
            deliverPreparedMainQuestion(root);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMainQuestionPrepared(UUID rootQuestionId) {
        InterviewQuestion root = questionRepository.findByIdForUpdate(rootQuestionId).orElse(null);
        if (root != null && "MOVE_ON".equals(root.getFollowUpDecision())) {
            deliverPreparedMainQuestion(root);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deliverFollowUp(UUID followUpQuestionId) {
        InterviewQuestion question = questionRepository.findByIdForUpdate(followUpQuestionId).orElse(null);
        if (question == null || question.getQuestionStatus() != QuestionStatus.READY) return;

        InterviewSession session = sessionRepository.findById(question.getRound().getSession().getId()).orElse(null);
        if (session == null || session.getStatus().name().equals("COMPLETED")) return;

        question.setQuestionStatus(QuestionStatus.PENDING);
        question.setDeliveredAt(LocalDateTime.now());
        questionRepository.save(question);
        session.setCurrentQuestionId(question.getId());
        session.setTurnSequence((session.getTurnSequence() == null ? 0 : session.getTurnSequence()) + 1);
        sessionRepository.save(session);

        InterviewQuestionResponse response = questionService.toResponse(question, question.getRound(), session);
        publish(session, "FOLLOW_UP_READY", response);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void publishEvaluation(UUID answerId, UUID questionId, AnswerEvaluation evaluation) {
        InterviewQuestion question = questionRepository.findById(questionId).orElse(null);
        if (question == null || evaluation == null) return;
        InterviewSession session = question.getRound().getSession();
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("answerId", answerId);
        payload.put("questionId", questionId);
        payload.put("score", evaluation.getScore());
        payload.put("technicalAccuracy", evaluation.getTechnicalAccuracy());
        payload.put("completeness", evaluation.getCompleteness());
        payload.put("clarity", evaluation.getClarity());
        payload.put("problemSolving", evaluation.getProblemSolving());
        payload.put("feedback", evaluation.getFeedback());
        payload.put("strengths", evaluation.getStrengths());
        payload.put("improvements", evaluation.getImprovements());
        payload.put("suggestedIdealAnswer", evaluation.getSuggestedIdealAnswer());
        publish(session, "ANSWER_EVALUATED", payload);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void publishError(UUID questionId, String code, String message) {
        if (questionId == null) return;
        InterviewQuestion question = questionRepository.findById(questionId).orElse(null);
        if (question == null) return;
        InterviewSession session = sessionRepository.findById(question.getRound().getSession().getId()).orElse(null);
        if (session == null) return;
        try {
            java.time.Instant now = java.time.Instant.now();
            InterviewEvent event = new InterviewEvent(
                    UUID.randomUUID().toString(),
                    "INTERVIEW_ERROR",
                    "INTERVIEW_ERROR",
                    null,
                    session.getId(),
                    session.getTurnSequence() == null ? 0 : session.getTurnSequence(),
                    now,
                    now,
                    java.util.Map.of("questionId", questionId),
                    code,
                    safeMessage(message));
            messagingTemplate.convertAndSend("/topic/interviews/" + session.getId(), event);
            messagingTemplate.convertAndSendToUser(session.getUserId().toString(), "/queue/interviews/events", event);
        } catch (Exception ex) {
            log.warn("Unable to publish INTERVIEW_ERROR for session {}: {}", session.getId(), ex.getMessage());
        }
    }

    private void deliverPreparedMainQuestion(InterviewQuestion root) {
        InterviewQuestion prepared = questionRepository
                .findFirstByPreparedForQuestionIdAndQuestionStatusOrderByQuestionOrderAsc(
                        root.getId(), QuestionStatus.READY).orElse(null);
        if (prepared == null) {
            // The preparation worker will call onMainQuestionPrepared after it commits.
            return;
        }

        InterviewSession session = sessionRepository.findById(root.getRound().getSession().getId()).orElse(null);
        if (session == null) return;

        prepared.setQuestionStatus(QuestionStatus.PENDING);
        prepared.setDeliveredAt(LocalDateTime.now());
        questionRepository.save(prepared);
        session.setCurrentQuestionId(prepared.getId());
        session.setTurnSequence((session.getTurnSequence() == null ? 0 : session.getTurnSequence()) + 1);
        sessionRepository.save(session);

        InterviewQuestionResponse response = questionService.toResponse(prepared, prepared.getRound(), session);
        publish(session, "NEXT_QUESTION_READY", response);
    }

    private void publish(InterviewSession session, String eventType, Object payload) {
        if (session == null) return;
        try {
            int sequence = session.getTurnSequence() == null ? 0 : session.getTurnSequence();
            InterviewEvent event = InterviewEvent.of(eventType, session.getId(), sequence, payload);
            messagingTemplate.convertAndSend("/topic/interviews/" + session.getId(), event);
            messagingTemplate.convertAndSendToUser(session.getUserId().toString(), "/queue/interviews/events", event);
        } catch (Exception ex) {
            log.warn("Unable to publish {} for session {}: {}", eventType, session.getId(), ex.getMessage());
        }
    }

    private String safeMessage(String message) {
        if (message == null || message.isBlank()) return "An asynchronous interview operation failed.";
        return message.length() > 300 ? message.substring(0, 300) : message;
    }
}
