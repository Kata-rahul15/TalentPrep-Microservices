package com.talentprep.interview.websocket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record InterviewEvent(
        String eventId,
        String eventType,
        String type,
        String commandId,
        UUID sessionId,
        Integer turnSequence,
        Instant occurredAt,
        Instant timestamp,
        Object payload,
        String errorCode,
        String message
) {
    public static InterviewEvent of(String eventType, UUID sessionId, Integer turnSequence, Object payload) {
        Instant now = Instant.now();
        return new InterviewEvent(
                UUID.randomUUID().toString(),
                eventType,
                eventType,
                null,
                sessionId,
                turnSequence != null ? turnSequence : 0,
                now,
                now,
                payload,
                null,
                null
        );
    }

    public static InterviewEvent of(String commandId, String type, UUID sessionId, Object payload) {
        Instant now = Instant.now();
        return new InterviewEvent(
                UUID.randomUUID().toString(),
                type,
                type,
                commandId,
                sessionId,
                0,
                now,
                now,
                payload,
                null,
                null
        );
    }

    public static InterviewEvent error(String commandId, UUID sessionId, String code, String message) {
        Instant now = Instant.now();
        return new InterviewEvent(
                UUID.randomUUID().toString(),
                "INTERVIEW_ERROR",
                "COMMAND_FAILED",
                commandId,
                sessionId,
                0,
                now,
                now,
                null,
                code,
                message
        );
    }
}
