package com.Resume.Ai.exception;

/**
 * Thrown when a filesystem (or future cloud-storage) I/O operation fails:
 * write failure, read failure, delete failure, or path-traversal attempt.
 *
 * <p>Maps to HTTP 500 Internal Server Error in {@link GlobalExceptionHandler}.</p>
 */
public class ResumeStorageException extends RuntimeException {

    public ResumeStorageException(String message) {
        super(message);
    }

    public ResumeStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
