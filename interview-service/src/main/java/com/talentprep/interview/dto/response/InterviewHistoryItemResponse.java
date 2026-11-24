package com.talentprep.interview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewHistoryItemResponse {
    private UUID sessionId;
    private String interviewType;
    private List<String> roundTypes;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private Integer overallScore;
    private String status;
    private Integer totalQuestions;
    private Integer completedQuestions;
    private Integer durationMinutes;
    private String targetRole;
    private String difficulty;
}
