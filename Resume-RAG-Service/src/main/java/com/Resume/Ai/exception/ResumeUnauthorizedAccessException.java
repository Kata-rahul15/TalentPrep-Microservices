package com.Resume.Ai.exception;

import java.util.UUID;

public class ResumeUnauthorizedAccessException extends RuntimeException {
    public ResumeUnauthorizedAccessException(UUID resumeId, UUID userId) {
        super("User " + userId + " is not authorized to access resume " + resumeId);
    }
}
