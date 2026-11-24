package com.talentprep.interview.exception;

public class ResumeIntegrationException extends RuntimeException {
    public ResumeIntegrationException(String message) {
        super(message);
    }

    public ResumeIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}

