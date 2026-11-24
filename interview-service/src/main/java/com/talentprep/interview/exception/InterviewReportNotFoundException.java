package com.talentprep.interview.exception;

import java.util.UUID;

public class InterviewReportNotFoundException extends RuntimeException {
    public InterviewReportNotFoundException(UUID sessionId) {
        super("Report has not been generated for interview session: " + sessionId);
    }
}
