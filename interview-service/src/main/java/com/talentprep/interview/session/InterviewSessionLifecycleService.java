package com.talentprep.interview.session;

import com.talentprep.interview.dto.request.SubmitAnswerRequest;
import com.talentprep.interview.dto.response.InterviewReportResponse;
import com.talentprep.interview.entity.InterviewReport;
import com.talentprep.interview.entity.InterviewSession;
import com.talentprep.interview.entity.enums.InterviewStatus;
import com.talentprep.interview.exception.InterviewNotFoundException;
import com.talentprep.interview.exception.InvalidSessionStateException;
import com.talentprep.interview.exception.UnauthorizedSessionException;
import com.talentprep.interview.evaluation.ReportGenerationService;
import com.talentprep.interview.repository.InterviewSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/** Session lifecycle transitions that do not belong to question generation or answer evaluation. */
@Service
public class InterviewSessionLifecycleService {
    private static final Logger log = LoggerFactory.getLogger(InterviewSessionLifecycleService.class);

    private final InterviewSessionRepository sessionRepository;
    private final InterviewSessionService sessionService;
    private final ReportGenerationService reportGenerationService;

    public InterviewSessionLifecycleService(InterviewSessionRepository sessionRepository,
                                            InterviewSessionService sessionService,
                                            ReportGenerationService reportGenerationService) {
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
        this.reportGenerationService = reportGenerationService;
    }

    @Transactional
    public void pauseSession(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        if (session.getStatus() != InterviewStatus.IN_PROGRESS
                && session.getStatus() != InterviewStatus.ROUND_TRANSITION) {
            throw new InvalidSessionStateException("Cannot pause session in status: " + session.getStatus());
        }
        session.setPausedAt(LocalDateTime.now());
        session.setStatus(InterviewStatus.PAUSED);
        sessionRepository.save(session);
        log.info("Session {} paused by user {}", sessionId, userId);
    }

    @Transactional
    public void resumeSession(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        if (session.getStatus() != InterviewStatus.PAUSED) {
            throw new InvalidSessionStateException("Cannot resume session that is not PAUSED.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (session.getPausedAt() != null) {
            long pausedDelta = Math.max(0L, Duration.between(session.getPausedAt(), now).getSeconds());
            long previousPaused = session.getTotalPausedSeconds() != null ? session.getTotalPausedSeconds() : 0L;
            session.setTotalPausedSeconds(previousPaused + pausedDelta);
            session.setPausedAt(null);
        }
        session.setStatus(InterviewStatus.IN_PROGRESS);
        sessionRepository.save(session);
        log.info("Session {} resumed by user {} (totalPausedSeconds={})",
                sessionId, userId, session.getTotalPausedSeconds());
    }

    @Transactional
    public void skipQuestion(UUID sessionId, UUID questionId, UUID userId) {
        // submitAnswer validates both ownership and that the question belongs to this exact session.
        SubmitAnswerRequest skipped = SubmitAnswerRequest.builder()
                .questionId(questionId)
                .answerText("SKIPPED")
                .timeTakenSeconds(0)
                .build();
        sessionService.submitAnswer(sessionId, skipped, userId);
    }

    @Transactional
    public InterviewReportResponse endSessionEarly(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        if (session.getStatus() != InterviewStatus.IN_PROGRESS
                && session.getStatus() != InterviewStatus.ROUND_TRANSITION
                && session.getStatus() != InterviewStatus.PAUSED) {
            throw new InvalidSessionStateException("Cannot end session in status: " + session.getStatus());
        }
        session.setStatus(InterviewStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);

        InterviewReport report = reportGenerationService.generateReport(session);
        return InterviewReportResponse.builder()
                .reportId(report.getId())
                .sessionId(report.getSession().getId())
                .overallScore(report.getOverallScore())
                .roundBreakdown(report.getRoundBreakdown())
                .strengths(report.getStrengths())
                .weaknesses(report.getWeaknesses())
                .improvementAreas(report.getImprovementAreas())
                .recommendedTopics(report.getRecommendedTopics())
                .summary(report.getSummary())
                .generatedAt(report.getGeneratedAt())
                .build();
    }

    private InterviewSession requireOwnedSession(UUID sessionId, UUID userId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InterviewNotFoundException(sessionId));
        if (!session.getUserId().equals(userId)) {
            throw new UnauthorizedSessionException(sessionId, userId);
        }
        return session;
    }
}
