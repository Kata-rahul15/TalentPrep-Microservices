package com.talentprep.interview.websocket.dto;

import java.util.UUID;

public record InterviewCommand(
        String commandId,
        InterviewCommandType type,
        UUID questionId,
        String answerText,
        Integer timeTakenSeconds
) {}
