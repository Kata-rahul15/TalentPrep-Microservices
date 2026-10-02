package com.Resume.Ai.matching;

import com.Resume.Ai.Entity.JobDescription;
import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Entity.ResumeJobMatch;
import com.Resume.Ai.Repositories.ResumeJobMatchRepository;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.Repositories.JobDescriptionRepository;
import com.Resume.Ai.dto.JobMatchRequest;
import com.Resume.Ai.dto.JobMatchResponse;
import com.Resume.Ai.enums.JobMatchStatus;
import com.Resume.Ai.exception.JobDescriptionNotFoundException;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class JobMatchingService {

    private final ResumeRepository resumeRepository;
    private final ResumeJobMatchRepository resumeJobMatchRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final JobMatchingProcessingService processingService;

    public JobMatchingService(
            ResumeRepository resumeRepository,
            ResumeJobMatchRepository resumeJobMatchRepository,
            JobDescriptionRepository jobDescriptionRepository,
            JobMatchingProcessingService processingService) {

        this.resumeRepository = resumeRepository;
        this.resumeJobMatchRepository = resumeJobMatchRepository;
        this.jobDescriptionRepository = jobDescriptionRepository;
        this.processingService = processingService;
    }

    /**
     * Creates a persistent job-match task and immediately starts
     * background processing.
     *
     * The HTTP request does NOT wait for AI/vector processing.
     */
    public JobMatchResponse startMatch(
            UUID authenticatedUserId,
            UUID resumeId,
            JobMatchRequest request) {

        Resume resume =
                resumeRepository.findById(resumeId)
                        .orElseThrow(
                                () -> new ResumeNotFoundException(resumeId)
                        );

        validateResumeOwnership(
                authenticatedUserId,
                resume
        );

        JobDescription jobDescription =
                loadJobDescription(
                        request.getJobDescriptionId(),
                        authenticatedUserId
                );

        if (buildJobText(jobDescription).isBlank()) {
            throw new IllegalArgumentException(
                    "Job description does not contain enough information to analyze."
            );
        }

        ResumeJobMatch match =
                ResumeJobMatch.builder()
                        .resume(resume)
                        .jobDescription(jobDescription)
                        .status(JobMatchStatus.QUEUED)
                        .build();

        ResumeJobMatch saved =
                resumeJobMatchRepository.save(match);

        /*
         * IMPORTANT:
         * JobMatchingProcessingService is a separate Spring bean.
         * This makes @Async actually work and avoids self-invocation.
         */
        processingService.processAsync(
                saved.getId()
        );

        return toResponse(saved);
    }

    /**
     * Returns the current state/result of a job-match task.
     */
    public JobMatchResponse getMatchStatus(
            UUID authenticatedUserId,
            UUID resumeId,
            UUID matchId) {

        ResumeJobMatch match =
                resumeJobMatchRepository.findById(matchId)
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Job match not found: " + matchId
                                )
                        );

        if (match.getResume() == null
                || !resumeId.equals(match.getResume().getId())) {

            throw new IllegalArgumentException(
                    "Job match does not belong to the requested resume."
            );
        }

        validateResumeOwnership(
                authenticatedUserId,
                match.getResume()
        );

        return toResponse(match);
    }

    private void validateResumeOwnership(
            UUID authenticatedUserId,
            Resume resume) {

        if (authenticatedUserId != null
                && !authenticatedUserId.equals(resume.getUserId())) {

            throw new ResumeUnauthorizedAccessException(
                    resume.getId(),
                    authenticatedUserId
            );
        }
    }

    private JobDescription loadJobDescription(
            UUID jobDescriptionId,
            UUID authenticatedUserId) {

        JobDescription jobDescription =
                jobDescriptionRepository.findById(jobDescriptionId)
                        .orElseThrow(
                                () -> new JobDescriptionNotFoundException(
                                        jobDescriptionId
                                )
                        );

        if (authenticatedUserId != null
                && !authenticatedUserId.equals(jobDescription.getUserId())) {

            throw new IllegalArgumentException(
                    "You are not authorized to access this job description."
            );
        }

        return jobDescription;
    }

    private String buildJobText(
            JobDescription jobDescription) {

        StringBuilder text =
                new StringBuilder();

        appendSection(
                text,
                jobDescription.getJobTitle()
        );

        appendSection(
                text,
                jobDescription.getCompanyName()
        );

        appendSection(
                text,
                jobDescription.getDescription()
        );

        return text.toString().trim();
    }

    private void appendSection(
            StringBuilder builder,
            String value) {

        if (value == null || value.isBlank()) {
            return;
        }

        if (!builder.isEmpty()) {
            builder.append("\n\n");
        }

        builder.append(value.trim());
    }

    private JobMatchResponse toResponse(
            ResumeJobMatch match) {

        List<String> matchedSkills =
                splitCommaSeparated(
                        match.getMatchedKeywords()
                );

        List<String> missingSkills =
                splitCommaSeparated(
                        match.getMissingKeywords()
                );

        List<String> recommendations =
                splitSemicolonSeparated(
                        match.getRecommendations()
                );

        return JobMatchResponse.builder()
                .matchId(match.getId())
                .resumeId(
                        match.getResume() != null
                                ? match.getResume().getId()
                                : null
                )
                .jobDescriptionId(
                        match.getJobDescription() != null
                                ? match.getJobDescription().getId()
                                : null
                )
                .status(
                        match.getStatus() == null
                                ? JobMatchStatus.COMPLETED
                                : match.getStatus()
                )
                .overallMatch(
                        match.getMatchPercentage() == null
                                ? null
                                : (int) Math.round(
                                        match.getMatchPercentage()
                                )
                )
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .missingKeywords(missingSkills)
                .recommendations(recommendations)
                .summary(match.getOptimizedSummary())
                .evidence(List.of())
                .errorMessage(match.getErrorMessage())
                .build();
    }

    private List<String> splitCommaSeparated(
            String value) {

        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(valuePart -> !valuePart.isBlank())
                .distinct()
                .toList();
    }

    private List<String> splitSemicolonSeparated(
            String value) {

        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split(";"))
                .map(String::trim)
                .filter(valuePart -> !valuePart.isBlank())
                .distinct()
                .toList();
    }
}
