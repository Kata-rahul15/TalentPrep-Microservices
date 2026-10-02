package com.Resume.Ai.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public record ApiError(
            LocalDateTime timestamp,
            int status,
            String error,
            String message
    ) {}

    // ──────────────────────────────────────────────
    // Resume-domain exceptions
    // ──────────────────────────────────────────────

    @ExceptionHandler(InvalidResumeFileException.class)
    public ResponseEntity<ApiError> handleInvalidFile(InvalidResumeFileException ex) {
        log.warn("Invalid resume file: {}", ex.getMessage());
        return buildError(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(UnsupportedResumeFormatException.class)
    public ResponseEntity<ApiError> handleUnsupportedFormat(UnsupportedResumeFormatException ex) {
        log.warn("Unsupported resume format: {}", ex.getMessage());
        return buildError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage());
    }

    @ExceptionHandler(ResumeStorageException.class)
    public ResponseEntity<ApiError> handleStorageError(ResumeStorageException ex) {
        // Log with cause so the root IOException appears in server logs
        log.error("Resume storage failure: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store resume file. Please try again.");
    }

    @ExceptionHandler(ResumeParsingException.class)
    public ResponseEntity<ApiError> handleParsingError(ResumeParsingException ex) {
        log.error("Resume parsing failure: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.UNPROCESSABLE_ENTITY,
                "Failed to extract content from the resume. The file may be corrupt or password-protected.");
    }

    @ExceptionHandler(ResumeNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResumeNotFoundException ex) {
        log.warn("Resume not found: {}", ex.getMessage());
        return buildError(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(JobDescriptionNotFoundException.class)
    public ResponseEntity<ApiError> handleJobDescriptionNotFound(JobDescriptionNotFoundException ex) {
        log.warn("Job description not found: {}", ex.getMessage());
        return buildError(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(JobMatchingException.class)
    public ResponseEntity<ApiError> handleJobMatchingError(JobMatchingException ex) {
        log.error("Job matching failure: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR,
                "An error occurred during job matching analysis.");
    }

    @ExceptionHandler(RequirementExtractionException.class)
    public ResponseEntity<ApiError> handleRequirementExtractionError(RequirementExtractionException ex) {
        log.error("Requirement extraction failure: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to extract job requirements.");
    }

    @ExceptionHandler(ResumeUnauthorizedAccessException.class)
    public ResponseEntity<ApiError> handleUnauthorizedAccess(ResumeUnauthorizedAccessException ex) {
        log.warn("Unauthorized resume access attempt: {}", ex.getMessage());
        return buildError(HttpStatus.FORBIDDEN, "You are not authorized to access this resume.");
    }

    @ExceptionHandler(EmbeddingGenerationException.class)
    public ResponseEntity<ApiError> handleEmbeddingError(EmbeddingGenerationException ex) {
        log.error("Embedding generation failure: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process document embedding. Please try again.");
    }

    @ExceptionHandler(VectorSearchException.class)
    public ResponseEntity<ApiError> handleVectorSearchError(VectorSearchException ex) {
        log.error("Vector search failure: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to perform vector similarity search.");
    }

    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ApiError> handleAiServiceError(AiServiceException ex) {
        log.error("AI service failure: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred while generating the AI response.");
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .reduce((a, b) -> a + ", " + b)
                .orElse("Validation failed.");
        log.warn("Validation failure: {}", detail);
        return buildError(HttpStatus.BAD_REQUEST, detail);
    }

    // ──────────────────────────────────────────────
    // Spring MVC / infrastructure exceptions
    // ──────────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        log.warn("File upload rejected — size limit exceeded: {}", ex.getMessage());
        return buildError(HttpStatus.PAYLOAD_TOO_LARGE,
                "Uploaded file exceeds the maximum allowed size of 10 MB.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return buildError(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred. Please try again later.");
    }

    // ──────────────────────────────────────────────
    // Helper
    // ──────────────────────────────────────────────

    private ResponseEntity<ApiError> buildError(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message
        ));
    }
}
