package com.talentprep.interview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentInterviewStateResponse {
    private UUID sessionId;
    private String status;
    private Integer turnSequence;
    private InterviewQuestionResponse currentQuestion;
    private boolean isInterviewerThinking;
    private boolean isEvaluating;
    private boolean isCompleted;
    private Long remainingSeconds;
}

