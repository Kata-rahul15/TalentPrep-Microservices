package com.talentprep.interview.exception;

import java.util.UUID;

public class InterviewNotFoundException extends RuntimeException {
    public InterviewNotFoundException(UUID id) {
        super("Interview session not found with ID: " + id);
    }

    public InterviewNotFoundException(String message) {
        super(message);
    }
}

