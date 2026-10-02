package com.Resume.Ai.dto;

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
public class ResumeAtsResponse {

    private UUID resumeId;
    private LocalDateTime evaluatedAt;
    private AtsScores scores;

    @Builder.Default
    private List<String> strengths = new ArrayList<>();

    @Builder.Default
    private List<String> weaknesses = new ArrayList<>();

    @Builder.Default
    private List<AtsSuggestion> suggestions = new ArrayList<>();

    @Builder.Default
    private List<String> missingKeywords = new ArrayList<>();
}
