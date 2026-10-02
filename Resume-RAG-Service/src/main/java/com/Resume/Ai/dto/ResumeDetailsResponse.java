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
public class ResumeDetailsResponse {

    private UUID resumeId;
    private String resumeName;
    private String originalFilename;
    private Long fileSize;
    private String mimeType;
    private String status;
    private Integer version;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String summary;

    // Backward-compatible display strings.
    private String education;
    private String experience;
    private String skills;
    private String certifications;
    private String achievements;
    private String languages;
    private String contactInformation;

    // Rich structured representation produced by the single AI analysis call.
    @Builder.Default
    private List<EducationDetails> educationDetails = new ArrayList<>();

    @Builder.Default
    private List<ExperienceDetails> experienceDetails = new ArrayList<>();

    @Builder.Default
    private List<ProjectResponse> projects = new ArrayList<>();

    @Builder.Default
    private List<String> skillsList = new ArrayList<>();

    @Builder.Default
    private List<String> certificationList = new ArrayList<>();

    @Builder.Default
    private List<String> achievementList = new ArrayList<>();

    @Builder.Default
    private List<String> languageList = new ArrayList<>();

    private ContactDetails contactDetails;
}
