package com.Resume.Ai.exception;

import java.util.UUID;

public class JobDescriptionNotFoundException extends RuntimeException {
    public JobDescriptionNotFoundException(UUID id) {
        super("Job description not found with id: " + id);
    }
}
