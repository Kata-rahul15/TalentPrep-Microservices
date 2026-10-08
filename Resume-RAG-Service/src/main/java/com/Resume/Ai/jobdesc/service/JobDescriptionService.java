package com.Resume.Ai.jobdesc.service;

import com.Resume.Ai.Entity.JobDescription;
import com.Resume.Ai.Repositories.JobDescriptionRepository;
import com.Resume.Ai.dto.CreateJobDescriptionRequest;
import com.Resume.Ai.dto.JobDescriptionResponse;
import com.Resume.Ai.exception.JobDescriptionNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class JobDescriptionService {

    private static final Logger log =
            LoggerFactory.getLogger(JobDescriptionService.class);

    private final JobDescriptionRepository jobDescriptionRepository;

    public JobDescriptionService(
            JobDescriptionRepository jobDescriptionRepository) {

        this.jobDescriptionRepository = jobDescriptionRepository;
    }

    // ============================================================
    // CREATE
    // ============================================================

    @Transactional
    public JobDescriptionResponse createJobDescription(
            UUID userId,
            CreateJobDescriptionRequest request) {

        String title = trimToNull(request.getTitle());
        String companyName = trimToNull(request.getCompanyName());
        String description = normalize(request.getDescription());

        if (title == null
                && companyName == null
                && description.isBlank()) {

            throw new IllegalArgumentException(
                    "At least one of title, companyName, or description must be provided."
            );
        }

        log.info(
                "Creating job description — user={}, title={}, company={}",
                userId,
                title,
                companyName
        );

        JobDescription jobDescription =
                JobDescription.builder()
                        .userId(userId)
                        .jobTitle(title)
                        .companyName(companyName)
                        .description(description)
                        .build();

        JobDescription saved =
                jobDescriptionRepository.save(jobDescription);

        log.info(
                "Job description created — id={}, user={}",
                saved.getId(),
                userId
        );

        return toResponse(saved);
    }

    // ============================================================
    // READ
    // ============================================================

    @Transactional(readOnly = true)
    public JobDescriptionResponse getJobDescription(UUID id) {

        return toResponse(
                getJobDescriptionEntity(id)
        );
    }

    @Transactional(readOnly = true)
    public JobDescription getJobDescriptionEntity(UUID id) {

        return jobDescriptionRepository.findById(id)
                .orElseThrow(
                        () -> new JobDescriptionNotFoundException(id)
                );
    }

    @Transactional(readOnly = true)
    public List<JobDescriptionResponse> getUserJobDescriptions(
            UUID userId) {

        return jobDescriptionRepository
                .findAllByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================================================
    // DELETE
    // ============================================================

    @Transactional
    public void deleteJobDescription(UUID id) {

        JobDescription jobDescription =
                getJobDescriptionEntity(id);

        jobDescriptionRepository.delete(jobDescription);

        log.info(
                "Job description deleted — id={}",
                id
        );
    }

    // ============================================================
    // NORMALIZATION
    // ============================================================

    /**
     * Normalizes pasted job-description text while preserving
     * meaningful characters such as:
     *
     * 0-1 years
     * Java-based
     * full-stack
     */
    public String normalize(String text) {

        if (text == null || text.isBlank()) {
            return "";
        }

        String cleaned = text
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replaceAll("[\\t\\f]+", " ")
                .replaceAll(" {2,}", " ");

        StringBuilder result =
                new StringBuilder();

        String[] lines = cleaned.split("\n");

        for (String line : lines) {

            String trimmed = line.trim();

            if (trimmed.isEmpty()) {
                continue;
            }

            /*
             * Normalize common bullet characters.
             *
             * We intentionally do NOT replace every '-'
             * because hyphens can be meaningful.
             */
            trimmed = trimmed.replaceFirst(
                    "^[•·▪]\\s*",
                    "- "
            );

            result
                    .append(trimmed)
                    .append('\n');
        }

        return result.toString().trim();
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private String trimToNull(String value) {

        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty()
                ? null
                : trimmed;
    }

    private JobDescriptionResponse toResponse(
            JobDescription entity) {

        return JobDescriptionResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .companyName(entity.getCompanyName())
                .jobTitle(entity.getJobTitle())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}