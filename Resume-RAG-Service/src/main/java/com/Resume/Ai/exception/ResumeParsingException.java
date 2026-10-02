package com.Resume.Ai.exception;

/**
 * Thrown when Apache Tika cannot extract text from a resume document:
 * corrupt file, password-protected PDF, or completely empty document.
 *
 * <p>Maps to HTTP 422 Unprocessable Entity in {@link GlobalExceptionHandler}.</p>
 */
public class ResumeParsingException extends RuntimeException {

    public ResumeParsingException(String message) {
        super(message);
    }

    public ResumeParsingException(String message, Throwable cause) {
        super(message, cause);
    }
}
