package com.talentprep.interview.dto.response;

import com.talentprep.interview.context.dto.ExperienceContext;
import com.talentprep.interview.context.dto.ProjectContext;
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
public class CandidateSetupDetailsResponse {
    private UUID resumeId;
    private boolean resumeAvailable;
    private String candidateName;
    private String targetRole;
    private List<String> availableTargetRoles;
    private String experienceLevel;

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private List<ProjectContext> projects = new ArrayList<>();

    @Builder.Default
    private List<ExperienceContext> experience = new ArrayList<>();

    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    private int availableSessionsRemaining;
    private String planType;
    private boolean unlimitedAccess;
}

