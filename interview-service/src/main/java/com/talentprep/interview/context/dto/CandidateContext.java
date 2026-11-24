package com.talentprep.interview.context.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateContext {
    private UUID userId;
    private UUID resumeId;
    @Builder.Default
    private boolean resumeAvailable = true;
    private Integer sourceResumeVersion;
    private String candidateName;
    private String email;
    private String summary;
    private String targetRole;
    private String experienceLevel;

    @Builder.Default
    private List<String> targetRoles = new ArrayList<>();

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private List<ProjectContext> projects = new ArrayList<>();

    @Builder.Default
    private List<ExperienceContext> experience = new ArrayList<>();

    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    @Builder.Default
    private List<String> achievements = new ArrayList<>();
}

