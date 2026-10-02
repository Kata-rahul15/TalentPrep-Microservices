package com.Resume.Ai.services;

import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Entity.ResumeChunk;
import com.Resume.Ai.Entity.ResumeEvaluation;
import com.Resume.Ai.Entity.ResumeSection;
import com.Resume.Ai.Repositories.ResumeChunkRepository;
import com.Resume.Ai.Repositories.ResumeEvaluationRepository;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.Repositories.ResumeSectionRepository;
import com.Resume.Ai.analysis.ResumeAiAnalyzer;
import com.Resume.Ai.chunking.Chunk;
import com.Resume.Ai.chunking.ResumeChunker;
import com.Resume.Ai.dto.*;
import com.Resume.Ai.enums.ResumeStatus;
import com.Resume.Ai.exception.AiServiceException;
import com.Resume.Ai.exception.EmbeddingGenerationException;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeParsingException;
import com.Resume.Ai.exception.ResumeStorageException;
import com.Resume.Ai.parser.ParsedResumeText;
import com.Resume.Ai.parser.ResumeParser;
import com.Resume.Ai.storage.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResumeProcessingService {

    private static final Logger log =
            LoggerFactory.getLogger(ResumeProcessingService.class);

    private final ResumeRepository resumeRepository;
    private final ResumeSectionRepository resumeSectionRepository;
    private final ResumeEvaluationRepository resumeEvaluationRepository;
    private final ResumeChunkRepository resumeChunkRepository;

    private final FileStorageService fileStorageService;
    private final ResumeParser resumeParser;
    private final ResumeAiAnalyzer resumeAiAnalyzer;
    private final ResumeChunker resumeChunker;
    private final VectorStore vectorStore;

    private final TransactionTemplate transactionTemplate;

    public ResumeProcessingService(
            ResumeRepository resumeRepository,
            ResumeSectionRepository resumeSectionRepository,
            ResumeEvaluationRepository resumeEvaluationRepository,
            ResumeChunkRepository resumeChunkRepository,
            FileStorageService fileStorageService,
            ResumeParser resumeParser,
            ResumeAiAnalyzer resumeAiAnalyzer,
            ResumeChunker resumeChunker,
            VectorStore vectorStore,
            TransactionTemplate transactionTemplate) {

        this.resumeRepository = resumeRepository;
        this.resumeSectionRepository = resumeSectionRepository;
        this.resumeEvaluationRepository = resumeEvaluationRepository;
        this.resumeChunkRepository = resumeChunkRepository;

        this.fileStorageService = fileStorageService;
        this.resumeParser = resumeParser;
        this.resumeAiAnalyzer = resumeAiAnalyzer;
        this.resumeChunker = resumeChunker;
        this.vectorStore = vectorStore;

        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Starts the expensive resume-processing pipeline in the background.
     *
     * HTTP upload does NOT wait for this method to finish.
     */
    @Async("resumeProcessingExecutor")
    public void processAsync(UUID resumeId) {

        log.info(
                "Background resume processing started — resumeId={}, thread={}",
                resumeId,
                Thread.currentThread().getName()
        );

        try {

            processResume(resumeId);

            log.info(
                    "Background resume processing completed — resumeId={}",
                    resumeId
            );

        } catch (AiServiceException ex) {

            log.error(
                    "Background AI processing failed — resumeId={}",
                    resumeId,
                    ex
            );

            markAsFailed(resumeId);

        } catch (ResumeParsingException ex) {

            log.error(
                    "Background resume parsing failed — resumeId={}",
                    resumeId,
                    ex
            );

            markAsFailed(resumeId);

        } catch (EmbeddingGenerationException ex) {

            log.error(
                    "Background embedding/vector processing failed — resumeId={}",
                    resumeId,
                    ex
            );

            markAsFailed(resumeId);

        } catch (ResumeStorageException ex) {

            log.error(
                    "Background resume storage operation failed — resumeId={}",
                    resumeId,
                    ex
            );

            markAsFailed(resumeId);

        } catch (Exception ex) {

            /*
             * Last-resort protection.
             *
             * A failed background task must never leave the resume
             * permanently stuck in PROCESSING.
             */
            log.error(
                    "Unexpected background resume processing failure — resumeId={}",
                    resumeId,
                    ex
            );

            markAsFailed(resumeId);
        }
    }

    /**
     * Complete background processing pipeline:
     *
     * PROCESSING
     *      ↓
     * Tika
     *      ↓
     * AI analysis
     *      ↓
     * Persist structured data + ATS
     *      ↓
     * Chunk + embeddings + PGVector
     *      ↓
     * READY
     */
    private void processResume(UUID resumeId) {

        log.info(
                "Resume background pipeline started — resumeId={}",
                resumeId
        );

        Resume resume = requireResume(resumeId);

        /*
         * Safety check.
         *
         * Only PROCESSING resumes should enter the pipeline.
         */
        if (resume.getStatus() != ResumeStatus.PROCESSING) {

            log.warn(
                    "Skipping resume processing because status is {} — resumeId={}",
                    resume.getStatus(),
                    resumeId
            );

            return;
        }

        // =========================================================
        // STEP 1 — Tika extraction
        // =========================================================

        ParsedResumeText parsedText;

        try {

            log.info(
                    "Tika extraction started — resumeId={}",
                    resumeId
            );

            Resource resource =
                    fileStorageService.download(
                            resume.getStoragePath()
                    );

            parsedText =
                    resumeParser.parse(
                            resource,
                            resume.getMimeType()
                    );

            log.info(
                    "Tika extraction completed — resumeId={}, chars={}",
                    resumeId,
                    parsedText.normalizedText().length()
            );

        } catch (ResumeParsingException ex) {

            log.error(
                    "Tika extraction failed — resumeId={}",
                    resumeId,
                    ex
            );

            throw ex;
        }

        // =========================================================
        // STEP 2 — ONE structured AI analysis
        // =========================================================

        ResumeAnalysisResponse analysis;

        try {

            log.info(
                    "Resume AI analysis started — resumeId={}",
                    resumeId
            );

            /*
             * The AI client handles configured transient retries.
             */
            analysis =
                    resumeAiAnalyzer.analyze(
                            parsedText.normalizedText()
                    );

            log.info(
                    "Resume AI analysis completed — resumeId={}",
                    resumeId
            );

        } catch (AiServiceException ex) {

            log.error(
                    "Resume AI analysis failed after configured retries — resumeId={}",
                    resumeId,
                    ex
            );

            throw ex;
        }

        // =========================================================
        // STEP 3 — Persist structured resume + ATS evaluation
        // =========================================================

        log.info(
                "Persisting AI analysis — resumeId={}",
                resumeId
        );

        transactionTemplate.execute(status -> {

            Resume managedResume =
                    requireResume(resumeId);

            persistAnalysis(
                    managedResume,
                    analysis
            );

            return null;
        });

        // =========================================================
        // STEP 4 — Chunk + embeddings + PGVector
        // =========================================================

        try {

            log.info(
                    "RAG vector indexing started — resumeId={}",
                    resumeId
            );

            indexResumeVectorsAndChunks(
                    resumeId,
                    parsedText
            );

            log.info(
                    "RAG vector indexing completed — resumeId={}",
                    resumeId
            );

        } catch (Exception ex) {

            log.error(
                    "RAG vector indexing failed — resumeId={}",
                    resumeId,
                    ex
            );

            throw new EmbeddingGenerationException(
                    "RAG indexing failed for resume.",
                    ex
            );
        }

        // =========================================================
        // STEP 5 — Mark READY
        // =========================================================
        Resume readyResume =
                transactionTemplate.execute(status -> {

                    Resume managedResume =
                            requireResume(resumeId);

                    // Deactivate the user's previous active resume
                    resumeRepository.deactivateActiveResumes(
                            managedResume.getUserId()
                    );

                    // Make this successfully processed resume active
                    managedResume.setActive(true);

                    // Mark it ready
                    managedResume.setStatus(
                            ResumeStatus.READY
                    );

                    return resumeRepository.save(
                            managedResume
                    );
                });
        log.info(
                "Resume processing completed successfully — resumeId={}, status={}",
                readyResume.getId(),
                readyResume.getStatus()
        );
    }

    // =============================================================
    // Persist AI analysis
    // =============================================================

    private void persistAnalysis(
            Resume managedResume,
            ResumeAnalysisResponse analysis) {

        ContactDetails contact =
                analysis.getContact() != null
                        ? analysis.getContact()
                        : new ContactDetails();

        ResumeSection section =
                ResumeSection.builder()
                        .resume(managedResume)
                        .summary(analysis.getSummary())

                        .education(
                                formatEducation(
                                        analysis.getEducation()
                                )
                        )
                        .educationDetails(
                                safeList(
                                        analysis.getEducation()
                                )
                        )

                        .experience(
                                formatExperience(
                                        analysis.getExperience()
                                )
                        )
                        .experienceDetails(
                                safeList(
                                        analysis.getExperience()
                                )
                        )

                        .projects(
                                safeList(
                                        analysis.getProjects()
                                )
                        )

                        .skills(
                                joinList(
                                        analysis.getSkills()
                                )
                        )
                        .skillsList(
                                safeList(
                                        analysis.getSkills()
                                )
                        )

                        .certifications(
                                joinList(
                                        analysis.getCertifications()
                                )
                        )
                        .certificationList(
                                safeList(
                                        analysis.getCertifications()
                                )
                        )

                        .achievements(
                                joinList(
                                        analysis.getAchievements()
                                )
                        )
                        .achievementList(
                                safeList(
                                        analysis.getAchievements()
                                )
                        )

                        .languages(
                                joinList(
                                        analysis.getLanguages()
                                )
                        )
                        .languageList(
                                safeList(
                                        analysis.getLanguages()
                                )
                        )

                        .contactInformation(
                                formatContact(contact)
                        )
                        .contactDetails(contact)

                        .build();

        AtsScores scores =
                analysis
                        .getAtsEvaluation()
                        .getScores();

        ResumeEvaluation evaluation =
                ResumeEvaluation.builder()
                        .resume(managedResume)

                        .atsScore(
                                score(scores.getAtsScore())
                        )

                        .keywordMatch(
                                score(scores.getKeywordMatch())
                        )

                        .formattingScore(
                                score(scores.getFormattingScore())
                        )

                        .technicalSkillsScore(
                                score(
                                        scores.getTechnicalSkillsScore()
                                )
                        )

                        .experienceScore(
                                score(
                                        scores.getExperienceScore()
                                )
                        )

                        .educationScore(
                                score(
                                        scores.getEducationScore()
                                )
                        )

                        .overallScore(
                                score(
                                        scores.getOverallScore()
                                )
                        )

                        .aiInsight(
                                analysis.getAiInsight()
                        )

                        .strengths(
                                safeList(
                                        analysis
                                                .getAtsEvaluation()
                                                .getStrengths()
                                )
                        )

                        .weaknesses(
                                safeList(
                                        analysis
                                                .getAtsEvaluation()
                                                .getWeaknesses()
                                )
                        )

                        .suggestions(
                                safeList(
                                        analysis
                                                .getAtsEvaluation()
                                                .getSuggestions()
                                )
                        )

                        .missingKeywords(
                                safeList(
                                        analysis
                                                .getAtsEvaluation()
                                                .getMissingKeywords()
                                )
                        )

                        .keyHighlights(
                                safeList(
                                        analysis.getKeyHighlights()
                                )
                        )

                        .topRecommendations(
                                safeList(
                                        analysis.getTopRecommendations()
                                )
                        )

                        .evaluatedAt(
                                LocalDateTime.now()
                        )

                        .build();

        resumeSectionRepository.save(section);
        resumeEvaluationRepository.save(evaluation);

        managedResume.setResumeSection(section);
        managedResume.setEvaluation(evaluation);
    }

    // =============================================================
    // Vector indexing
    // =============================================================

    private void indexResumeVectorsAndChunks(
            UUID resumeId,
            ParsedResumeText parsedText) {

        List<Chunk> chunks =
                resumeChunker.chunk(parsedText);

        if (chunks.isEmpty()) {

            throw new EmbeddingGenerationException(
                    "No chunks were generated from the resume.",
                    new IllegalStateException(
                            "Resume chunking produced no content."
                    )
            );
        }

        List<Document> documents =
                new ArrayList<>();

        for (Chunk chunk : chunks) {

            Map<String, Object> metadata =
                    Map.of(
                            "resumeId",
                            resumeId.toString(),

                            "section",
                            chunk.section(),

                            "chunkIndex",
                            chunk.chunkIndex()
                    );

            documents.add(
                    new Document(
                            chunk.content(),
                            metadata
                    )
            );
        }

        log.info(
                "Indexing {} vector documents for resumeId={}",
                documents.size(),
                resumeId
        );

        vectorStore.add(documents);

        transactionTemplate.execute(status -> {

            Resume managed =
                    requireResume(resumeId);

            List<ResumeChunk> entities =
                    new ArrayList<>();

            for (Chunk chunk : chunks) {

                entities.add(
                        ResumeChunk.builder()
                                .resume(managed)
                                .chunkNumber(
                                        chunk.chunkIndex()
                                )
                                .section(
                                        chunk.section()
                                )
                                .chunkText(
                                        chunk.content()
                                )
                                .build()
                );
            }

            resumeChunkRepository.saveAll(
                    entities
            );

            return null;
        });
    }

    // =============================================================
    // Failure handling
    // =============================================================

    private void markAsFailed(UUID resumeId) {

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

    // =============================================================
    // Repository helper
    // =============================================================

    private Resume requireResume(UUID resumeId) {

        return resumeRepository
                .findById(resumeId)
                .orElseThrow(
                        () ->
                                new ResumeNotFoundException(
                                        resumeId
                                )
                );
    }

    // =============================================================
    // Formatting helpers
    // =============================================================

    private Integer score(Integer value) {

        if (value == null) {
            return 0;
        }

        return Math.max(
                0,
                Math.min(100, value)
        );
    }

    private String formatEducation(
            List<EducationDetails> values) {

        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
                .map(item -> {

                    List<String> parts =
                            new ArrayList<>();

                    if (item.getDegree() != null) {
                        parts.add(
                                item.getDegree()
                        );
                    }

                    if (item.getFieldOfStudy() != null) {
                        parts.add(
                                item.getFieldOfStudy()
                        );
                    }

                    if (item.getInstitution() != null) {
                        parts.add(
                                item.getInstitution()
                        );
                    }

                    String dates =
                            joinNonBlank(
                                    item.getStartDate(),
                                    item.getEndDate()
                            );

                    if (!dates.isBlank()) {
                        parts.add(
                                "(" + dates + ")"
                        );
                    }

                    if (item.getGrade() != null) {
                        parts.add(
                                "Grade: "
                                        + item.getGrade()
                        );
                    }

                    if (item.getDetails() != null) {
                        parts.add(
                                item.getDetails()
                        );
                    }

                    return String.join(
                            " | ",
                            parts
                    );
                })
                .collect(
                        Collectors.joining("\n")
                );
    }

    private String formatExperience(
            List<ExperienceDetails> values) {

        if (values == null || values.isEmpty()) {
            return "";
        }

        return values.stream()
                .map(item -> {

                    StringBuilder text =
                            new StringBuilder();

                    text.append(
                            nonBlank(
                                    item.getRole(),
                                    "Experience"
                            )
                    );

                    if (item.getCompany() != null) {

                        text.append(" at ")
                                .append(
                                        item.getCompany()
                                );
                    }

                    String dates =
                            joinNonBlank(
                                    item.getStartDate(),
                                    item.getEndDate()
                            );

                    if (!dates.isBlank()) {

                        text.append(" (")
                                .append(dates)
                                .append(")");
                    }

                    if (item.getLocation() != null) {

                        text.append(" — ")
                                .append(
                                        item.getLocation()
                                );
                    }

                    for (
                            String responsibility :
                            safeList(
                                    item.getResponsibilities()
                            )
                    ) {

                        text.append("\n• ")
                                .append(
                                        responsibility
                                );
                    }

                    for (
                            String achievement :
                            safeList(
                                    item.getAchievements()
                            )
                    ) {

                        text.append("\n• ")
                                .append(
                                        achievement
                                );
                    }

                    if (
                            !safeList(
                                    item.getTechnologies()
                            ).isEmpty()
                    ) {

                        text.append(
                                        "\nTechnologies: "
                                )
                                .append(
                                        joinList(
                                                item.getTechnologies()
                                        )
                                );
                    }

                    return text.toString();

                })
                .collect(
                        Collectors.joining("\n\n")
                );
    }

    private String formatContact(
            ContactDetails contact) {

        List<String> values =
                new ArrayList<>();

        if (contact.getName() != null) {
            values.add(
                    contact.getName()
            );
        }

        if (contact.getEmail() != null) {
            values.add(
                    contact.getEmail()
            );
        }

        if (contact.getPhone() != null) {
            values.add(
                    contact.getPhone()
            );
        }

        if (contact.getLocation() != null) {
            values.add(
                    contact.getLocation()
            );
        }

        if (contact.getLinkedin() != null) {
            values.add(
                    contact.getLinkedin()
            );
        }

        if (contact.getGithub() != null) {
            values.add(
                    contact.getGithub()
            );
        }

        if (contact.getPortfolio() != null) {
            values.add(
                    contact.getPortfolio()
            );
        }

        return String.join(
                "\n",
                values
        );
    }

    private String joinList(
            List<String> values) {

        return safeList(values)
                .stream()
                .filter(
                        value ->
                                value != null
                                        && !value.isBlank()
                )
                .collect(
                        Collectors.joining(", ")
                );
    }

    private String joinNonBlank(
            String first,
            String second) {

        if (
                first == null
                        || first.isBlank()
        ) {

            return second == null
                    ? ""
                    : second;
        }

        if (
                second == null
                        || second.isBlank()
        ) {

            return first;
        }

        return first + " – " + second;
    }

    private String nonBlank(
            String value,
            String fallback) {

        return value == null
                || value.isBlank()
                ? fallback
                : value;
    }

    private <T> List<T> safeList(
            List<T> values) {

        return values == null
                ? new ArrayList<>()
                : values;
    }
}