package com.Resume.Ai.profile;

import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Entity.ResumeSection;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.Repositories.ResumeSectionRepository;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Builds a stable candidate-profile contract from the existing structured
 * resume. No new profile table or copied data is maintained.
 */
@Service
public class ResumeProfileService {
    private final ResumeRepository resumes;
    private final ResumeSectionRepository sections;

    public ResumeProfileService(ResumeRepository resumes, ResumeSectionRepository sections) {
        this.resumes = resumes;
        this.sections = sections;
    }

    @Transactional(readOnly = true)
    public ResumeProfile getActiveProfile(UUID authenticatedUserId) {
        if (authenticatedUserId == null) {
            throw new IllegalArgumentException("Authenticated user ID is required.");
        }
        Resume resume = resumes.findFirstByUserIdAndActiveTrueOrderByCreatedAtDesc(authenticatedUserId)
                .orElseThrow(() -> new ResumeNotFoundException(authenticatedUserId));
        return build(resume, authenticatedUserId);
    }

    @Transactional(readOnly = true)
    public ResumeProfile getProfile(UUID resumeId, UUID authenticatedUserId) {
        if (authenticatedUserId == null) {
            throw new IllegalArgumentException("Authenticated user ID is required.");
        }
        Resume resume = resumes.findById(resumeId)
                .orElseThrow(() -> new ResumeNotFoundException(resumeId));
        if (!authenticatedUserId.equals(resume.getUserId())) {
            throw new ResumeUnauthorizedAccessException(resumeId, authenticatedUserId);
        }
        return build(resume, authenticatedUserId);
    }

    private ResumeProfile build(Resume resume, UUID userId) {
        ResumeSection section = sections.findByResume_Id(resume.getId()).orElse(null);
        if (section == null) {
            return ResumeProfile.builder()
                    .candidateId(userId).resumeId(resume.getId())
                    .sourceResumeVersion(resume.getVersion())
                    .resumeName(resume.getResumeName())
                    .build();
        }

        List<String> skills = safe(section.getSkillsList());
        List<String> targetRoles = safe(section.getTargetRoles());
        if (targetRoles.isEmpty()) {
            targetRoles = deriveLegacyTargetRoles(skills, safe(section.getCertificationList()),
                    section.getSummary(), safe(section.getProjects()));
        }
        return ResumeProfile.builder()
                .candidateId(userId)
                .resumeId(resume.getId())
                .sourceResumeVersion(resume.getVersion())
                .resumeName(resume.getResumeName())
                .name(section.getContactDetails() == null ? null : section.getContactDetails().getName())
                .summary(section.getSummary())
                .contact(section.getContactDetails())
                .skills(skills)
                .education(safe(section.getEducationDetails()))
                .experience(safe(section.getExperienceDetails()))
                .projects(safe(section.getProjects()))
                .certifications(safe(section.getCertificationList()))
                .achievements(safe(section.getAchievementList()))
                .languages(safe(section.getLanguageList()))
                .targetRoles(targetRoles)
                .technologies(skills)
                .build();
    }

    /**
     * Compatibility fallback for resumes analyzed before targetRoles existed.
     * Prefer domain-specific evidence and never default every candidate to Java.
     */
    private List<String> deriveLegacyTargetRoles(List<String> skills, List<String> certifications,
                                                  String summary, List<com.Resume.Ai.Entity.ProjectDetails> projects) {
        String evidence = String.join(" ", skills) + " " + String.join(" ", certifications) + " "
                + (summary == null ? "" : summary) + " " + projects;
        String lower = evidence.toLowerCase(java.util.Locale.ROOT);
        java.util.LinkedHashSet<String> roles = new java.util.LinkedHashSet<>();
        if (lower.contains("servicenow") || lower.contains("flow designer") || lower.contains("business rules")
                || lower.contains("certified application developer") || lower.contains("certified system administrator")) {
            roles.add("ServiceNow Developer");
        }
        if (lower.contains("python")) {
            roles.add(lower.contains("django") || lower.contains("flask") || lower.contains("fastapi")
                    ? "Junior Python Backend Developer" : "Junior Python Developer");
        }
        if (lower.contains("java")) {
            roles.add(lower.contains("spring") ? "Junior Java Backend Developer" : "Junior Java Developer");
        }
        if (lower.contains("javascript") || lower.contains("node.js") || lower.contains("react")) {
            roles.add("Junior Web Developer");
        }
        if (roles.isEmpty() && (lower.contains("sql") || lower.contains("mysql") || lower.contains("postgres"))) {
            roles.add("Junior Database Developer");
        }
        return roles.stream().limit(2).toList();
    }

    private <T> List<T> safe(List<T> values) {
        return values == null ? List.of() : List.copyOf(values);
    }
}
