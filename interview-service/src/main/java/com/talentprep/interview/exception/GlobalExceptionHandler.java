package com.talentprep.interview.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(com.talentprep.interview.identity.MissingGatewayIdentityException.class)
    public ResponseEntity<Map<String, Object>> handleMissingIdentity(
            com.talentprep.interview.identity.MissingGatewayIdentityException ex) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "MISSING_GATEWAY_IDENTITY", ex.getMessage());
    }

    @ExceptionHandler(com.talentprep.interview.coding.exception.CodeExecutionException.class)
    public ResponseEntity<Map<String, Object>> handleCodeExecution(com.talentprep.interview.coding.exception.CodeExecutionException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode());
        if (status == null) status = HttpStatus.SERVICE_UNAVAILABLE;
        log.warn("Code execution error (status={}): {}", ex.getStatusCode(), ex.getMessage());
        return buildErrorResponse(status, "CODE_EXECUTION_ERROR", ex.getMessage());
    }

    @ExceptionHandler(AiEvaluationUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleAiUnavailable(AiEvaluationUnavailableException ex) {
        log.warn("AI evaluation unavailable: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, "AI_EVALUATION_UNAVAILABLE", ex.getMessage());
    }

    @ExceptionHandler(QuotaExceededException.class)
    public ResponseEntity<Map<String, Object>> handleQuotaExceeded(QuotaExceededException ex) {
        log.warn("Quota exceeded: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.TOO_MANY_REQUESTS, "QUOTA_EXCEEDED", ex.getMessage());
    }

    @ExceptionHandler(InterviewNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(InterviewNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(InterviewReportNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleReportNotFound(InterviewReportNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "REPORT_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedSessionException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedSessionException ex) {
        log.warn("Unauthorized session access attempt: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage());
    }

    @ExceptionHandler(InvalidSessionStateException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidState(InvalidSessionStateException ex) {
        log.warn("Invalid session state: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "INVALID_STATE", ex.getMessage());
    }

    @ExceptionHandler(ResumeIntegrationException.class)
    public ResponseEntity<Map<String, Object>> handleResumeIntegration(ResumeIntegrationException ex) {
        log.error("Resume Service integration error: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_GATEWAY, "RESUME_INTEGRATION_ERROR", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "VALIDATION_FAILED");
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled internal server error: ", ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected server error occurred. Please try again later.");
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String code, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", code);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}

