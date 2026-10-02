package com.Resume.Ai.exception;

import java.util.UUID;

/**
 * Thrown when a resume cannot be found by its ID in the database.
 *
 * <p>Maps to HTTP 404 Not Found in {@link GlobalExceptionHandler}.</p>
 */
public class ResumeNotFoundException extends RuntimeException {

    public ResumeNotFoundException(UUID resumeId) {

        super("Resume not found with id: " + resumeId);
    }
}
