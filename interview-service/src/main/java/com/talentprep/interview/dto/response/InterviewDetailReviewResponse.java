package com.talentprep.interview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewDetailReviewResponse {
    private UUID sessionId;
    private String targetRole;
    private String difficulty;
    private String mode;
    private String status;
    private Integer overallScore;
    private Integer durationMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String candidateName;

    @Builder.Default
    private List<InterviewRoundReviewDto> rounds = new ArrayList<>();

    @Builder.Default
    private List<InterviewQuestionReviewDto> questions = new ArrayList<>();

    private InterviewReportResponse report;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewRoundReviewDto {
        private UUID roundId;
        private Integer roundOrder;
        private String roundType;
        private String status;
        private Integer roundScore;
        private Integer targetQuestionCount;
        private Integer completedQuestionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewQuestionReviewDto {
        private UUID questionId;
        private UUID roundId;
        private Integer roundOrder;
        private String roundType;
        private Integer questionOrder;
        private String questionText;
        private String questionCategory;
        private String difficulty;
        private String questionStatus;
        private String codingBoilerplate;
        private List<Map<String, Object>> codingTestCases;
        private String candidateAnswer;
        private String codeSubmission;
        private String language;
        private Integer timeTakenSeconds;
        private LocalDateTime submittedAt;
        private Integer score;
        private Integer technicalAccuracy;
        private Integer completeness;
        private Integer clarity;
        private Integer problemSolving;
        private String feedback;
        private List<String> strengths;
        private List<String> improvements;
        private Map<String, Object> executionMetrics;
    }
}
