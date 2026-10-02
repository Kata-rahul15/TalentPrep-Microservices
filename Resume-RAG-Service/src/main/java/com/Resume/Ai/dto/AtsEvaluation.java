package com.Resume.Ai.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtsEvaluation {

    @Builder.Default
    private AtsScores scores = AtsScores.builder()
            .atsScore(0)
            .keywordMatch(0)
            .formattingScore(0)
            .technicalSkillsScore(0)
            .experienceScore(0)
            .educationScore(0)
            .overallScore(0)
            .build();

    @Builder.Default
    private List<String> strengths = new ArrayList<>();

    @Builder.Default
    private List<String> weaknesses = new ArrayList<>();

    @Builder.Default
    private List<AtsSuggestion> suggestions = new ArrayList<>();

    @Builder.Default
    private List<String> missingKeywords = new ArrayList<>();
}
