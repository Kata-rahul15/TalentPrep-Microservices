package com.talentprep.interview.coding.exception;

import lombok.Getter;

@Getter
public class CodeExecutionException extends RuntimeException {

    private final int statusCode;

    public CodeExecutionException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public CodeExecutionException(int statusCode, String message, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }
}
