package com.Resume.Ai.dto;

import com.Resume.Ai.enums.JobMatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobMatchResponse {

    private UUID matchId;

    private UUID resumeId;

    private UUID jobDescriptionId;

    private JobMatchStatus status;

    /**
     * Final normalized match score from 0-100.
     *
     * Null while the match is still processing.
     */
    private Integer overallMatch;

    @Builder.Default
    private List<String> matchedSkills = List.of();

    @Builder.Default
    private List<String> missingSkills = List.of();

    @Builder.Default
    private List<String> missingKeywords = List.of();

    @Builder.Default
    private List<String> recommendations = List.of();

    private String summary;

    @Builder.Default
    private List<ResumeEvidence> evidence = List.of();

    /**
     * Populated only when status == FAILED.
     */
    private String errorMessage;
}
