package com.Resume.Ai.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtsScores {
    private Integer atsScore;
    private Integer keywordMatch;
    private Integer formattingScore;
    private Integer technicalSkillsScore;
    private Integer experienceScore;
    private Integer educationScore;
    private Integer overallScore;
}
