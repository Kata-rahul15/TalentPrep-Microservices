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
public class InterviewReportResponse {
    private UUID reportId;
    private UUID sessionId;
    private Integer overallScore;

    @Builder.Default
    private List<Map<String, Object>> roundBreakdown = new ArrayList<>();

    @Builder.Default
    private List<String> strengths = new ArrayList<>();

    @Builder.Default
    private List<String> weaknesses = new ArrayList<>();

    @Builder.Default
    private List<String> improvementAreas = new ArrayList<>();

    @Builder.Default
    private List<String> recommendedTopics = new ArrayList<>();

    private String summary;
    private LocalDateTime generatedAt;
}

