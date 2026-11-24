package com.talentprep.interview.websocket.controller;

import com.talentprep.interview.dto.request.SubmitAnswerRequest;
import com.talentprep.interview.dto.response.InterviewQuestionResponse;
import com.talentprep.interview.websocket.security.InterviewPrincipal;
import com.talentprep.interview.session.InterviewSessionLifecycleService;
import com.talentprep.interview.session.InterviewSessionService;
import com.talentprep.interview.websocket.dto.InterviewCommand;
import com.talentprep.interview.websocket.dto.InterviewCommandType;
import com.talentprep.interview.websocket.dto.InterviewEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;
import java.util.concurrent.Executor;

@Controller
public class InterviewWebSocketController {
    private static final Logger log = LoggerFactory.getLogger(InterviewWebSocketController.class);
    private static final String USER_DESTINATION = "/queue/interviews/events";

    private final InterviewSessionService sessionService;
    private final InterviewSessionLifecycleService lifecycleService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Executor executor;

    public InterviewWebSocketController(InterviewSessionService sessionService,
                                        InterviewSessionLifecycleService lifecycleService,
                                        SimpMessagingTemplate messagingTemplate,
                                        @Qualifier("interviewWebSocketExecutor") Executor executor) {
        this.sessionService = sessionService;
        this.lifecycleService = lifecycleService;
        this.messagingTemplate = messagingTemplate;
        this.executor = executor;
    }

    @MessageMapping("/interviews/{sessionId}/commands")
    public void handleCommand(@DestinationVariable UUID sessionId, InterviewCommand command, Principal principal) {
        if (!(principal instanceof InterviewPrincipal authenticatedUser)) {
            throw new IllegalArgumentException("Authenticated user is required");
        }
        if (command == null || command.commandId() == null || command.commandId().isBlank() || command.type() == null) {
            send(authenticatedUser, InterviewEvent.error(command == null ? null : command.commandId(),
                    sessionId, "INVALID_COMMAND", "commandId and type are required"));
            return;
        }

        send(authenticatedUser, InterviewEvent.of(command.commandId(), "COMMAND_ACKNOWLEDGED", sessionId, null));
        try {
            executor.execute(() -> process(sessionId, command, authenticatedUser));
        } catch (RuntimeException rejected) {
            send(authenticatedUser, InterviewEvent.error(command.commandId(), sessionId,
                    "SERVER_BUSY", "The interview is busy. Please retry after checking the current session state."));
        }
    }

    private void process(UUID sessionId, InterviewCommand command, InterviewPrincipal user) {
        try {
            switch (command.type()) {
                case START_INTERVIEW -> {
                    InterviewQuestionResponse question = sessionService.startSession(sessionId, user.userId());
                    send(user, InterviewEvent.of(command.commandId(), "INTERVIEW_STARTED", sessionId, question));
                }
                case NEXT_QUESTION -> {
                    InterviewQuestionResponse question = sessionService.getNextQuestion(sessionId, user.userId());
                    send(user, InterviewEvent.of(command.commandId(), question == null ? "NO_MORE_QUESTIONS" : "QUESTION_GENERATED", sessionId, question));
                }
                case SUBMIT_ANSWER -> {
                    if (command.questionId() == null) {
                        send(user, InterviewEvent.error(command.commandId(), sessionId, "QUESTION_ID_REQUIRED", "questionId is required"));
                        return;
                    }
                    var request = SubmitAnswerRequest.builder()
                            .questionId(command.questionId())
                            .clientRequestId(command.commandId())
                            .answerText(command.answerText())
                            .timeTakenSeconds(command.timeTakenSeconds())
                            .build();
                    var ack = sessionService.submitAnswer(sessionId, request, user.userId());
                    send(user, InterviewEvent.of(command.commandId(), "ANSWER_RECEIVED", sessionId, ack));
                }
                case PAUSE_INTERVIEW -> {
                    lifecycleService.pauseSession(sessionId, user.userId());
                    send(user, InterviewEvent.of(command.commandId(), "INTERVIEW_PAUSED", sessionId, null));
                }
                case RESUME_INTERVIEW -> {
                    lifecycleService.resumeSession(sessionId, user.userId());
                    send(user, InterviewEvent.of(command.commandId(), "INTERVIEW_RESUMED", sessionId, null));
                }
                case SKIP_QUESTION -> {
                    if (command.questionId() == null) {
                        send(user, InterviewEvent.error(command.commandId(), sessionId, "QUESTION_ID_REQUIRED", "questionId is required"));
                        return;
                    }
                    lifecycleService.skipQuestion(sessionId, command.questionId(), user.userId());
                    send(user, InterviewEvent.of(command.commandId(), "QUESTION_SKIPPED", sessionId, command.questionId()));
                }
                case END_INTERVIEW -> {
                    var report = lifecycleService.endSessionEarly(sessionId, user.userId());
                    send(user, InterviewEvent.of(command.commandId(), "INTERVIEW_COMPLETED", sessionId, report));
                }
            }
        } catch (Exception ex) {
            log.warn("WebSocket interview command {} failed for session {} and user {}: {}",
                    command.type(), sessionId, user.userId(), ex.getClass().getSimpleName());
            send(user, InterviewEvent.error(command.commandId(), sessionId, "COMMAND_FAILED",
                    "The command could not be completed. Refresh the session state before retrying."));
        }
    }

    private void send(InterviewPrincipal user, InterviewEvent event) {
        messagingTemplate.convertAndSendToUser(user.getName(), USER_DESTINATION, event);
    }
}
