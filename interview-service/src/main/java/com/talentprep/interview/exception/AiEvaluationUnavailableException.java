package com.talentprep.interview.exception;

public class AiEvaluationUnavailableException extends RuntimeException {
    public AiEvaluationUnavailableException(String message) { super(message); }
    public AiEvaluationUnavailableException(String message, Throwable cause) { super(message, cause); }
}
