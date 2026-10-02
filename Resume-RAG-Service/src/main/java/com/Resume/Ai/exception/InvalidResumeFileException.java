package com.Resume.Ai.exception;

/**
 * Thrown when an uploaded file is null, empty, has a missing/invalid filename,
 * or exceeds the configured size limit.
 *
 * <p>Maps to HTTP 400 Bad Request in {@link GlobalExceptionHandler}.</p>
 */
public class InvalidResumeFileException extends RuntimeException {

    public InvalidResumeFileException(String message) {
        super(message);
    }

    public InvalidResumeFileException(String message, Throwable cause) {
        super(message, cause);
    }
}
