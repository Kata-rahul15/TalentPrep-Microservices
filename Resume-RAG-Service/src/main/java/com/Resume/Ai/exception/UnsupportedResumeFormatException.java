package com.Resume.Ai.exception;

/**
 * Thrown when a file's detected MIME type or extension is not in the
 * allowed list (PDF / DOCX).
 *
 * <p>Maps to HTTP 415 Unsupported Media Type in {@link GlobalExceptionHandler}.</p>
 */
public class UnsupportedResumeFormatException extends RuntimeException {

    public UnsupportedResumeFormatException(String message) {
        super(message);
    }

    public UnsupportedResumeFormatException(String message, Throwable cause) {
        super(message, cause);
    }
}
