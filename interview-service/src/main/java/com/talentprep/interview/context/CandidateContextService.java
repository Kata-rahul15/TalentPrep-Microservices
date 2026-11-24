package com.talentprep.interview.context;

import com.talentprep.interview.client.ResumeServiceClient;
import com.talentprep.interview.client.dto.ExperienceDetailsDto;
import com.talentprep.interview.client.dto.ProjectDetailsDto;
import com.talentprep.interview.client.dto.ResumeProfileDto;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.context.dto.ExperienceContext;
import com.talentprep.interview.context.dto.ProjectContext;
import com.talentprep.interview.exception.ResumeIntegrationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CandidateContextService {

    private static final Logger log = LoggerFactory.getLogger(CandidateContextService.class);

    private final ResumeServiceClient resumeServiceClient;

    public CandidateContextService(ResumeServiceClient resumeServiceClient) {
        this.resumeServiceClient = resumeServiceClient;
    }

    public CandidateContext buildContext(UUID resumeId, UUID authenticatedUserId) {
        if (authenticatedUserId == null) {
            throw new IllegalArgumentException("Authenticated user ID must not be null.");
        }

        ResumeProfileDto profile = (resumeId != null)
                ? resumeServiceClient.getResumeProfile(resumeId, authenticatedUserId)
                : resumeServiceClient.getActiveResumeProfile(authenticatedUserId);

        if (profile == null) {
            if (resumeId != null) {
                throw new ResumeIntegrationException("Failed to retrieve candidate profile from Resume Service.");
            }
            log.info("No active resume available for user {}; proceeding with role-based context", authenticatedUserId);
            return CandidateContext.builder()
                    .userId(authenticatedUserId)
                    .resumeId(null)
                    .resumeAvailable(false)
                    .candidateName("Candidate")
                    .targetRole("Software Engineer")
                    .experienceLevel("Mid Level")
                    .targetRoles(List.of())
                    .skills(List.of())
                    .projects(List.of())
                    .experience(List.of())
                    .certifications(List.of())
                    .achievements(List.of())
                    .build();
        }

        // Enforce ownership: candidateId in profile MUST match authenticatedUserId
        if (profile.getCandidateId() != null && !authenticatedUserId.equals(profile.getCandidateId())) {
            log.error("Ownership mismatch: authenticatedUserId={}, profileCandidateId={}",
                    authenticatedUserId, profile.getCandidateId());
            throw new ResumeIntegrationException("Access denied: You do not own the requested resume.");
        }

        return mapToCandidateContext(profile, authenticatedUserId);
    }

    public CandidateContext mapToCandidateContext(ResumeProfileDto profile, UUID userId) {
        String candidateName = profile.getName();
        if (candidateName == null && profile.getContact() != null) {
            candidateName = profile.getContact().getName();
        }
        if (candidateName == null || candidateName.isBlank()) {
            candidateName = "Candidate";
        }

        String primaryRole = null;
        if (profile.getTargetRoles() != null && !profile.getTargetRoles().isEmpty()) {
            primaryRole = profile.getTargetRoles().get(0);
        } else if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            primaryRole = profile.getSkills().get(0) + " Developer";
        } else {
            primaryRole = "Software Engineer";
        }

        String email = profile.getContact() != null ? profile.getContact().getEmail() : null;

        List<ProjectContext> projectContexts = new ArrayList<>();
        if (profile.getProjects() != null) {
            for (ProjectDetailsDto p : profile.getProjects()) {
                projectContexts.add(ProjectContext.builder()
                        .name(p.getName())
                        .description(p.getDescription() != null ? p.getDescription() : "")
                        .technologies(p.getTechnologies() != null ? p.getTechnologies() : List.of())
                        .highlights(p.getHighlights() != null ? p.getHighlights() : List.of())
                        .build());
            }
        }

        List<ExperienceContext> experienceContexts = new ArrayList<>();
        if (profile.getExperience() != null) {
            for (ExperienceDetailsDto e : profile.getExperience()) {
                String duration = (e.getStartDate() != null ? e.getStartDate() : "") +
                        " - " + (e.getEndDate() != null ? e.getEndDate() : "");
                experienceContexts.add(ExperienceContext.builder()
                        .company(e.getCompany())
                        .role(e.getRole())
                        .duration(duration.trim())
                        .responsibilities(e.getResponsibilities() != null ? e.getResponsibilities() : List.of())
                        .achievements(e.getAchievements() != null ? e.getAchievements() : List.of())
                        .technologies(e.getTechnologies() != null ? e.getTechnologies() : List.of())
                        .build());
            }
        }

        String experienceLevel = deriveExperienceLevel(profile.getExperience());

        return CandidateContext.builder()
                .userId(userId)
                .resumeId(profile.getResumeId())
                .resumeAvailable(true)
                .sourceResumeVersion(profile.getSourceResumeVersion())
                .candidateName(candidateName)
                .email(email)
                .summary(profile.getSummary() != null ? profile.getSummary() : "")
                .targetRole(primaryRole)
                .targetRoles(profile.getTargetRoles() != null ? profile.getTargetRoles() : List.of())
                .experienceLevel(experienceLevel)
                .skills(profile.getSkills() != null ? profile.getSkills() : List.of())
                .projects(projectContexts)
                .experience(experienceContexts)
                .certifications(profile.getCertifications() != null ? profile.getCertifications() : List.of())
                .achievements(profile.getAchievements() != null ? profile.getAchievements() : List.of())
                .build();
    }

    private String deriveExperienceLevel(List<ExperienceDetailsDto> experience) {
        if (experience == null || experience.isEmpty()) {
            return "Entry Level";
        }
        int count = experience.size();
        if (count >= 5) {
            return "Lead / Principal";
        } else if (count >= 3) {
            return "Senior Level";
        } else if (count >= 1) {
            return "Mid Level";
        }
        return "Entry Level";
    }
}

