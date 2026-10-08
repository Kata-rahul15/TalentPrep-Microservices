package com.Resume.Ai.profile;

import com.Resume.Ai.dto.ContactDetails;
import com.Resume.Ai.dto.EducationDetails;
import com.Resume.Ai.dto.ExperienceDetails;
import com.Resume.Ai.Entity.ProjectDetails;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Reusable, read-only projection of a candidate's verified resume content.
 * Derived from existing Resume/ResumeSection records; it is not a duplicate
 * persistence model.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeProfile {
    private UUID candidateId;
    private UUID resumeId;
    private Integer sourceResumeVersion;
    private String resumeName;
    private String name;
    private String summary;
    private ContactDetails contact;
    @Builder.Default private List<String> skills = new ArrayList<>();
    @Builder.Default private List<EducationDetails> education = new ArrayList<>();
    @Builder.Default private List<ExperienceDetails> experience = new ArrayList<>();
    @Builder.Default private List<ProjectDetails> projects = new ArrayList<>();
    @Builder.Default private List<String> certifications = new ArrayList<>();
    @Builder.Default private List<String> achievements = new ArrayList<>();
    @Builder.Default private List<String> languages = new ArrayList<>();
    @Builder.Default private List<String> targetRoles = new ArrayList<>();
    @Builder.Default private List<String> technologies = new ArrayList<>();
}
