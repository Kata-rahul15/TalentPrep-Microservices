package com.Resume.Ai.dto;

import com.Resume.Ai.enums.ResumeStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeOverviewResponse {

    private UUID resumeId;
    private String resumeName;
    private String originalFilename;
    private ResumeStatus status;
    private LocalDateTime uploadedAt;
    private LocalDateTime evaluatedAt;

    private AtsScores scores;
    private String aiInsight;

    @Builder.Default
    private List<String> keyHighlights = new ArrayList<>();

    @Builder.Default
    private List<AtsSuggestion> topRecommendations = new ArrayList<>();

    private Integer projectCount;
    private Integer experienceCount;
    private Integer educationCount;
    private Integer skillCount;
}
