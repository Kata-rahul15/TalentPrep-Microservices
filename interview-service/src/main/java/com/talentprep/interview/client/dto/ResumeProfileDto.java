package com.talentprep.interview.client.dto;

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
public class ResumeProfileDto {
    private UUID candidateId;
    private UUID resumeId;
    private Integer sourceResumeVersion;
    private String resumeName;
    private String name;
    private String summary;
    private ContactDetailsDto contact;

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private List<EducationDetailsDto> education = new ArrayList<>();

    @Builder.Default
    private List<ExperienceDetailsDto> experience = new ArrayList<>();

    @Builder.Default
    private List<ProjectDetailsDto> projects = new ArrayList<>();

    @Builder.Default
    private List<String> certifications = new ArrayList<>();

    @Builder.Default
    private List<String> achievements = new ArrayList<>();

    @Builder.Default
    private List<String> languages = new ArrayList<>();

    @Builder.Default
    private List<String> targetRoles = new ArrayList<>();

    @Builder.Default
    private List<String> technologies = new ArrayList<>();
}

