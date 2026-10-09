package com.Resume.Ai.dto;

import com.Resume.Ai.Entity.ProjectDetails;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Single structured response returned by the one AI call performed during
 * resume ingestion. This object is the semantic representation of the resume.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeAnalysisResponse {

    private String candidateName;
    private String summary;
    private ContactDetails contact;

    @Builder.Default
    private List<EducationDetails> education = new ArrayList<>();

    @Builder.Default
    private List<ExperienceDetails> experience = new ArrayList<>();

    @Builder.Default
    private List<ProjectDetails> projects = new ArrayList<>();

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    @Builder.Default
    private List<String> achievements = new ArrayList<>();

    @Builder.Default
    private List<String> languages = new ArrayList<>();

    /** Up to two resume-grounded job titles generated during the same analysis call. */
    @Builder.Default
    private List<String> targetRoles = new ArrayList<>();

    private String aiInsight;

    @Builder.Default
    private List<String> keyHighlights = new ArrayList<>();

    @Builder.Default
    private List<AtsSuggestion> topRecommendations = new ArrayList<>();

    @Builder.Default
    private AtsEvaluation atsEvaluation = new AtsEvaluation();
}
