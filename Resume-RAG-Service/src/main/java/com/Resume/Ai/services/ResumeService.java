package com.Resume.Ai.services;

import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Entity.ResumeChunk;
import com.Resume.Ai.Entity.ResumeEvaluation;
import com.Resume.Ai.Entity.ResumeSection;
import com.Resume.Ai.Entity.ProjectDetails;

import com.Resume.Ai.Repositories.ResumeChunkRepository;
import com.Resume.Ai.Repositories.ResumeEvaluationRepository;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.Repositories.ResumeSectionRepository;

import com.Resume.Ai.dto.*;

import com.Resume.Ai.enums.ResumeStatus;

import com.Resume.Ai.exception.AiServiceException;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeStorageException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;

import com.Resume.Ai.storage.FileStorageService;
import com.Resume.Ai.storage.StoredFile;
import com.Resume.Ai.validation.ResumeFileValidator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ResumeService {

    private static final Logger log =
            LoggerFactory.getLogger(ResumeService.class);

    private final ResumeRepository resumeRepository;
    private final ResumeSectionRepository resumeSectionRepository;
    private final ResumeEvaluationRepository resumeEvaluationRepository;
    private final ResumeChunkRepository resumeChunkRepository;

    private final FileStorageService fileStorageService;
    private final ResumeFileValidator fileValidator;

    private final VectorStore vectorStore;

    private final ResumeProcessingService resumeProcessingService;

    private final TransactionTemplate transactionTemplate;

    public ResumeService(
            ResumeRepository resumeRepository,
            ResumeSectionRepository resumeSectionRepository,
            ResumeEvaluationRepository resumeEvaluationRepository,
            ResumeChunkRepository resumeChunkRepository,
            FileStorageService fileStorageService,
            ResumeFileValidator fileValidator,
            VectorStore vectorStore,
            ResumeProcessingService resumeProcessingService,
            TransactionTemplate transactionTemplate) {

        this.resumeRepository = resumeRepository;
        this.resumeSectionRepository = resumeSectionRepository;
        this.resumeEvaluationRepository = resumeEvaluationRepository;
        this.resumeChunkRepository = resumeChunkRepository;

        this.fileStorageService = fileStorageService;
        this.fileValidator = fileValidator;

        this.vectorStore = vectorStore;

        this.resumeProcessingService =
                resumeProcessingService;

        this.transactionTemplate =
                transactionTemplate;
    }

    // =============================================================
    // UPLOAD
    // =============================================================

    /**
     * Fast upload operation.
     *
     * This method:
     *
     * 1. Validates file
     * 2. Creates DB record
     * 3. Stores physical file
     * 4. Sets PROCESSING
     * 5. Starts background processing
     * 6. Returns immediately
     *
     * It does NOT:
     *
     * - parse with Tika
     * - call AI
     * - generate embeddings
     * - call PGVector
     */
    public ResumeResponse uploadResume(
            ResumeRequest request) {

        log.info(
                "Resume upload started — user={}, file={}",
                request.getUserId(),
                request.getFile() != null
                        ? request.getFile()
                        .getOriginalFilename()
                        : "null"
        );

        // =========================================================
        // STEP 1 — Validate file
        // =========================================================

        fileValidator.validate(
                request.getFile()
        );

        // =========================================================
        // STEP 2 — Create initial DB record
        // =========================================================

        UUID resumeId =
                transactionTemplate.execute(status -> {
                    Resume initial =
                            Resume.builder()

                                    .userId(
                                            request.getUserId()
                                    )

                                    .resumeName(
                                            request.getResumeName()
                                    )

                                    .originalFilename(
                                            request.getFile()
                                                    .getOriginalFilename()
                                    )

                                    .storedFilename("")

                                    .storagePath("")

                                    .fileSize(
                                            request.getFile()
                                                    .getSize()
                                    )

                                    .mimeType(
                                            request.getFile()
                                                    .getContentType()
                                    )

                                    .status(
                                            ResumeStatus.UPLOADING
                                    )

                                    .version(1)

                                    // New uploads are NOT active yet.
                                    .active(false)

                                    .build();
                    return resumeRepository
                            .save(initial)
                            .getId();
                });

        // =========================================================
        // STEP 3 — Store physical file
        // =========================================================

        StoredFile storedFile;

        try {

            storedFile =
                    fileStorageService.store(
                            resumeId,
                            request.getFile()
                    );

            log.info(
                    "File stored successfully — resumeId={}, path={}",
                    resumeId,
                    storedFile.storagePath()
            );

        } catch (ResumeStorageException ex) {

            log.error(
                    "File storage failed — resumeId={}",
                    resumeId,
                    ex
            );

            markAsFailed(resumeId);

            throw ex;
        }

        // =========================================================
        // STEP 4 — Save storage metadata + PROCESSING
        // =========================================================

        final StoredFile sf =
                storedFile;

        Resume processingResume =
                transactionTemplate.execute(status -> {

                    Resume resume =
                            requireResume(resumeId);

                    resume.setStoredFilename(
                            sf.storedFilename()
                    );

                    resume.setStoragePath(
                            sf.storagePath()
                    );

                    resume.setFileSize(
                            sf.sizeBytes()
                    );

                    resume.setMimeType(
                            sf.mimeType()
                    );

                    resume.setStatus(
                            ResumeStatus.PROCESSING
                    );

                    return resumeRepository
                            .save(resume);
                });

        // =========================================================
        // STEP 5 — Start background processing
        // =========================================================

        try {

            resumeProcessingService
                    .processAsync(resumeId);

        } catch (Exception ex) {

            /*
             * This normally only happens if the executor rejects
             * the task.
             */
            log.error(
                    "Could not schedule resume processing — resumeId={}",
                    resumeId,
                    ex
            );

            markAsFailed(resumeId);

            throw new AiServiceException(
                    "Resume was uploaded but could not be scheduled for processing.",
                    ex
            );
        }

        // =========================================================
        // STEP 6 — Return immediately
        // =========================================================

        log.info(
                "Resume uploaded successfully and queued for processing — resumeId={}",
                resumeId
        );

        return toResponse(
                processingResume
        );
    }

    // =============================================================
    // GET RESUME
    // =============================================================

    public ResumeResponse getResume(
            UUID resumeId) {

        return getResume(
                resumeId,
                null
        );
    }

    public ResumeResponse getResume(
            UUID resumeId,
            UUID userId) {

        Resume resume =
                requireResume(resumeId);

        validateOwnership(
                resume,
                userId
        );

        return toResponse(resume);
    }

    // =============================================================
    // GET USER RESUMES
    // =============================================================

    public List<ResumeSummaryResponse> getUserResumes(
            UUID userId) {

        return resumeRepository
                .findAllByUserId(userId)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    // =============================================================
    // RESUME DETAILS
    // =============================================================

    @Transactional(readOnly = true)
    public ResumeDetailsResponse getResumeDetails(
            UUID userId) {

        return getResumeDetails(
                findLatestResumeForUser(userId)
        );
    }

    @Transactional(readOnly = true)
    public ResumeDetailsResponse getResumeDetails(
            UUID resumeId,
            UUID userId) {

        Resume resume =
                requireResume(resumeId);

        validateOwnership(
                resume,
                userId
        );

        return getResumeDetails(
                resume
        );
    }

    private ResumeDetailsResponse getResumeDetails(
            Resume resume) {

        ResumeSection section =
                resume.getResumeSection();

        return ResumeDetailsResponse.builder()

                .resumeId(
                        resume.getId()
                )

                .resumeName(
                        resume.getResumeName()
                )

                .originalFilename(
                        resume.getOriginalFilename()
                )

                .fileSize(
                        resume.getFileSize()
                )

                .mimeType(
                        resume.getMimeType()
                )

                .status(
                        resume.getStatus() != null
                                ? resume.getStatus().name()
                                : null
                )

                .version(
                        resume.getVersion()
                )

                .active(
                        resume.getActive()
                )

                .createdAt(
                        resume.getCreatedAt()
                )

                .updatedAt(
                        resume.getUpdatedAt()
                )

                .summary(
                        section != null
                                ? section.getSummary()
                                : null
                )

                .education(
                        section != null
                                ? section.getEducation()
                                : null
                )

                .educationDetails(
                        section != null
                                ? safeList(
                                section.getEducationDetails()
                        )
                                : List.of()
                )

                .experience(
                        section != null
                                ? section.getExperience()
                                : null
                )

                .experienceDetails(
                        section != null
                                ? safeList(
                                section.getExperienceDetails()
                        )
                                : List.of()
                )

                .projects(
                        section == null
                                || section.getProjects() == null
                                ? List.of()
                                : section
                                .getProjects()
                                .stream()
                                .map(
                                        this::toProjectResponse
                                )
                                .toList()
                )

                .skills(
                        section != null
                                ? section.getSkills()
                                : null
                )

                .skillsList(
                        section != null
                                ? safeList(
                                section.getSkillsList()
                        )
                                : List.of()
                )

                .certifications(
                        section != null
                                ? section.getCertifications()
                                : null
                )

                .certificationList(
                        section != null
                                ? safeList(
                                section.getCertificationList()
                        )
                                : List.of()
                )

                .achievements(
                        section != null
                                ? section.getAchievements()
                                : null
                )

                .achievementList(
                        section != null
                                ? safeList(
                                section.getAchievementList()
                        )
                                : List.of()
                )

                .languages(
                        section != null
                                ? section.getLanguages()
                                : null
                )

                .languageList(
                        section != null
                                ? safeList(
                                section.getLanguageList()
                        )
                                : List.of()
                )

                .contactInformation(
                        section != null
                                ? section.getContactInformation()
                                : null
                )

                .contactDetails(
                        section != null
                                ? section.getContactDetails()
                                : null
                )

                .build();
    }

    // =============================================================
    // OVERVIEW
    // =============================================================

    @Transactional(readOnly = true)
    public ResumeOverviewResponse getResumeOverview(
            UUID userId) {

        return getResumeOverview(
                findLatestResumeForUser(userId)
        );
    }

    @Transactional(readOnly = true)
    public ResumeOverviewResponse getResumeOverview(
            UUID resumeId,
            UUID userId) {

        Resume resume =
                requireResume(resumeId);

        validateOwnership(
                resume,
                userId
        );

        return getResumeOverview(
                resume
        );
    }

    private ResumeOverviewResponse getResumeOverview(
            Resume resume) {

        ResumeEvaluation evaluation =
                getEvaluation(resume);

        ResumeSection section =
                resume.getResumeSection();

        return ResumeOverviewResponse.builder()

                .resumeId(
                        resume.getId()
                )

                .resumeName(
                        resume.getResumeName()
                )

                .originalFilename(
                        resume.getOriginalFilename()
                )

                .status(
                        resume.getStatus()
                )

                .uploadedAt(
                        resume.getCreatedAt()
                )

                .evaluatedAt(
                        evaluation.getEvaluatedAt()
                )

                .scores(
                        toScores(evaluation)
                )

                .aiInsight(
                        evaluation.getAiInsight()
                )

                .keyHighlights(
                        safeList(
                                evaluation.getKeyHighlights()
                        )
                )

                .topRecommendations(
                        safeList(
                                evaluation.getTopRecommendations()
                        )
                )

                .projectCount(
                        section == null
                                ? 0
                                : safeList(
                                section.getProjects()
                        ).size()
                )

                .experienceCount(
                        section == null
                                ? 0
                                : safeList(
                                section.getExperienceDetails()
                        ).size()
                )

                .educationCount(
                        section == null
                                ? 0
                                : safeList(
                                section.getEducationDetails()
                        ).size()
                )

                .skillCount(
                        section == null
                                ? 0
                                : safeList(
                                section.getSkillsList()
                        ).size()
                )

                .build();
    }

    // =============================================================
    // ATS
    // =============================================================

    @Transactional(readOnly = true)
    public ResumeAtsResponse getResumeAts(
            UUID userId) {

        return getResumeAts(
                findLatestResumeForUser(userId)
        );
    }

    @Transactional(readOnly = true)
    public ResumeAtsResponse getResumeAts(
            UUID resumeId,
            UUID userId) {

        Resume resume =
                requireResume(resumeId);

        validateOwnership(
                resume,
                userId
        );

        return getResumeAts(
                resume
        );
    }

    private ResumeAtsResponse getResumeAts(
            Resume resume) {

        ResumeEvaluation evaluation =
                getEvaluation(resume);

        return ResumeAtsResponse.builder()

                .resumeId(
                        resume.getId()
                )

                .evaluatedAt(
                        evaluation.getEvaluatedAt()
                )

                .scores(
                        toScores(evaluation)
                )

                .strengths(
                        safeList(
                                evaluation.getStrengths()
                        )
                )

                .weaknesses(
                        safeList(
                                evaluation.getWeaknesses()
                        )
                )

                .suggestions(
                        safeList(
                                evaluation.getSuggestions()
                        )
                )

                .missingKeywords(
                        safeList(
                                evaluation.getMissingKeywords()
                        )
                )

                .build();
    }

    // =============================================================
    // UPDATE
    // =============================================================

    public ResumeResponse updateResume(
            UUID resumeId,
            UpdateResumeRequest request) {

        return updateResume(
                resumeId,
                null,
                request
        );
    }

    public ResumeResponse updateResume(
            UUID resumeId,
            UUID userId,
            UpdateResumeRequest request) {

        Resume resume =
                requireResume(resumeId);

        validateOwnership(
                resume,
                userId
        );

        if (
                request.getResumeName() != null
                        && !request.getResumeName().isBlank()
        ) {

            resume.setResumeName(
                    request.getResumeName()
            );
        }


        return toResponse(
                resumeRepository.save(resume)
        );
    }

    // =============================================================
    // DELETE
    // =============================================================

    public void deleteResume(
            UUID resumeId) {

        deleteResume(
                resumeId,
                null
        );
    }

    public void deleteResume(
            UUID resumeId,
            UUID userId) {

        Resume resume =
                requireResume(resumeId);

        validateOwnership(
                resume,
                userId
        );

        if (
                resume.getStoragePath() != null
                        && !resume.getStoragePath().isBlank()
        ) {

            try {

                fileStorageService.delete(
                        resume.getStoragePath()
                );

            } catch (ResumeStorageException ex) {

                log.warn(
                        "Could not delete physical file for resumeId={}",
                        resumeId,
                        ex
                );
            }
        }

        try {

            deleteResumeVectorsAndChunks(
                    resumeId
            );

        } catch (Exception ex) {

            log.warn(
                    "Could not delete vectors for resumeId={}",
                    resumeId,
                    ex
            );
        }

        resumeRepository.delete(
                resume
        );
    }

    // =============================================================
    // HELPERS
    // =============================================================
// =============================================================
// ACTIVATE RESUME
// =============================================================

    @Transactional
    public void activateResume(
            UUID resumeId
    ) {

        Resume resume =
                requireResume(resumeId);

        UUID userId =
                resume.getUserId();

        // Deactivate the user's current resume
        resumeRepository.deactivateActiveResumes(
                userId
        );

        // Activate the newly processed resume
        resume.setActive(true);

        resumeRepository.save(resume);

        log.info(
                "Resume activated — resumeId={}, userId={}",
                resumeId,
                userId
        );
    }
    private Resume findLatestResumeForUser(
            UUID userId) {

        return resumeRepository
                .findByUserIdAndActiveTrue(userId)
                .orElseThrow(
                        () ->
                                new ResumeNotFoundException(
                                        userId
                                )
                );
    }
    private ResumeEvaluation getEvaluation(
            Resume resume) {

        return resumeEvaluationRepository
                .findByResume_Id(
                        resume.getId()
                )
                .orElseThrow(
                        () ->
                                new AiServiceException(
                                        "Resume analysis is not available for resume "
                                                + resume.getId(),
                                        null
                                )
                );
    }

    private void validateOwnership(
            Resume resume,
            UUID userId) {

        if (
                userId != null
                        && !resume
                        .getUserId()
                        .equals(userId)
        ) {

            throw new ResumeUnauthorizedAccessException(
                    resume.getId(),
                    userId
            );
        }
    }

    private void deleteResumeVectorsAndChunks(
            UUID resumeId) {

        String filterExpr =
                String.format(
                        "resumeId == '%s'",
                        resumeId
                );

        vectorStore.delete(
                filterExpr
        );

        resumeChunkRepository
                .deleteAllByResumeId(
                        resumeId
                );
    }

    private Resume requireResume(
            UUID resumeId) {

        return resumeRepository
                .findById(resumeId)
                .orElseThrow(
                        () ->
                                new ResumeNotFoundException(
                                        resumeId
                                )
                );
    }

    private void markAsFailed(
            UUID resumeId) {

        try {

            transactionTemplate.execute(status -> {

                resumeRepository
                        .findById(resumeId)
                        .ifPresent(resume -> {

                            resume.setStatus(
                                    ResumeStatus.FAILED
                            );

                            resumeRepository.save(
                                    resume
                            );

                            log.warn(
                                    "Resume marked FAILED — resumeId={}",
                                    resumeId
                            );
                        });

                return null;
            });

        } catch (Exception ex) {

            log.error(
                    "Could not mark resume as FAILED — resumeId={}",
                    resumeId,
                    ex
            );
        }
    }

    private Integer score(
            Integer value) {

        if (value == null) {
            return 0;
        }

        return Math.max(
                0,
                Math.min(
                        100,
                        value
                )
        );
    }

    private AtsScores toScores(
            ResumeEvaluation evaluation) {

        return AtsScores.builder()

                .atsScore(
                        evaluation.getAtsScore()
                )

                .keywordMatch(
                        evaluation.getKeywordMatch()
                )

                .formattingScore(
                        evaluation.getFormattingScore()
                )

                .technicalSkillsScore(
                        evaluation.getTechnicalSkillsScore()
                )

                .experienceScore(
                        evaluation.getExperienceScore()
                )

                .educationScore(
                        evaluation.getEducationScore()
                )

                .overallScore(
                        evaluation.getOverallScore()
                )

                .build();
    }

    private ProjectResponse toProjectResponse(
            ProjectDetails project) {

        if (project == null) {

            return ProjectResponse
                    .builder()
                    .description("")
                    .technologies(List.of())
                    .highlights(List.of())
                    .build();
        }

        return ProjectResponse
                .builder()

                .name(
                        project.getName()
                )

                .description(
                        project.getDescription() == null
                                ? ""
                                : project.getDescription()
                )

                .technologies(
                        project.getTechnologies() == null
                                ? List.of()
                                : project.getTechnologies()
                )

                .highlights(
                        project.getHighlights() == null
                                ? List.of()
                                : project.getHighlights()
                )

                .build();
    }

    private <T> List<T> safeList(
            List<T> values) {

        return values == null
                ? new ArrayList<>()
                : values;
    }

    private ResumeResponse toResponse(
            Resume entity) {

        return ResumeResponse
                .builder()

                .id(
                        entity.getId()
                )

                .userId(
                        entity.getUserId()
                )

                .resumeName(
                        entity.getResumeName()
                )

                .originalFilename(
                        entity.getOriginalFilename()
                )

                .fileSize(
                        entity.getFileSize()
                )

                .mimeType(
                        entity.getMimeType()
                )

                .status(
                        entity.getStatus()
                )

                .version(
                        entity.getVersion()
                )

                .active(
                        entity.getActive()
                )

                .createdAt(
                        entity.getCreatedAt()
                )

                .updatedAt(
                        entity.getUpdatedAt()
                )

                .build();
    }

    private ResumeSummaryResponse toSummaryResponse(
            Resume entity) {

        return ResumeSummaryResponse
                .builder()

                .id(
                        entity.getId()
                )

                .resumeName(
                        entity.getResumeName()
                )

                .status(
                        entity.getStatus()
                )

                .createdAt(
                        entity.getCreatedAt()
                )

                .build();
    }
}