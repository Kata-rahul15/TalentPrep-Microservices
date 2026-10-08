package com.Resume.Ai.builder;

import com.Resume.Ai.dto.*;
import com.Resume.Ai.Entity.ProjectDetails;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResumeContentSnapshot {
    private String summary;

    private String education;

    @Builder.Default
    private List<EducationDetails> educationDetails = new ArrayList<>();

    private String experience;
    @Builder.Default
    private List<ExperienceDetails> experienceDetails = new ArrayList<>();
    @Builder.Default
    private List<ProjectDetails> projects = new ArrayList<>();
    private String skills;
    @Builder.Default
    private List<String> skillsList = new ArrayList<>();
    private String certifications;
    @Builder.Default
    private List<String> certificationList = new ArrayList<>();
    private String achievements;
    @Builder.Default
    private List<String> achievementList = new ArrayList<>();
    private String languages;
    @Builder.Default
    private List<String> languageList = new ArrayList<>();
    private String contactInformation;
    private ContactDetails contactDetails;
    private Map<String, Object> builderContent;
}
