package com.talentprep.interview.exception;

import java.util.UUID;

public class UnauthorizedSessionException extends RuntimeException {
    public UnauthorizedSessionException(UUID sessionId, UUID userId) {
        super("User " + userId + " is not authorized to access interview session " + sessionId);
    }

    public UnauthorizedSessionException(String message) {
        super(message);
    }
}

