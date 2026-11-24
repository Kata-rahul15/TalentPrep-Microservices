package com.Resume.Ai.exception;

import java.util.UUID;

public class JobDescriptionUnauthorizedAccessException extends RuntimeException {
    public JobDescriptionUnauthorizedAccessException(UUID id) {
        super("Not authorized to access job description: " + id);
    }
}
