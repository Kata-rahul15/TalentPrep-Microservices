package com.Resume.Ai.matching;

import com.Resume.Ai.Entity.JobDescription;
import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Entity.ResumeJobMatch;
import com.Resume.Ai.Repositories.ResumeJobMatchRepository;
import com.Resume.Ai.config.JobMatchingProperties;
import com.Resume.Ai.dto.JobRequirementsDto;
import com.Resume.Ai.dto.MatchingSkill;
import com.Resume.Ai.dto.MissingSkill;
import com.Resume.Ai.dto.ResumeEvidence;
import com.Resume.Ai.enums.JobMatchStatus;
import com.Resume.Ai.enums.MatchType;
import com.Resume.Ai.exception.JobMatchingException;
import com.Resume.Ai.exception.RequirementExtractionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class JobMatchingProcessingService {

    private static final Logger log =
            LoggerFactory.getLogger(JobMatchingProcessingService.class);

    private final VectorStore vectorStore;
    private final ResumeJobMatchRepository resumeJobMatchRepository;
    private final JobMatchingProperties matchingProperties;
    private final ChatClient chatClient;

    public JobMatchingProcessingService(
            VectorStore vectorStore,
            ResumeJobMatchRepository resumeJobMatchRepository,
            JobMatchingProperties matchingProperties,
            ChatClient chatClient) {

        this.vectorStore = vectorStore;
        this.resumeJobMatchRepository = resumeJobMatchRepository;
        this.matchingProperties = matchingProperties;
        this.chatClient = chatClient;
    }

    // ============================================================
    // ASYNC MATCHING PIPELINE
    // ============================================================

    @Async("jobMatchingProcessingExecutor")
    public void processAsync(UUID matchId) {

        ResumeJobMatch match = null;

        try {

            match = resumeJobMatchRepository.findById(matchId)
                    .orElseThrow(() ->
                            new JobMatchingException(
                                    "Job match not found: " + matchId
                            )
                    );

            if (match.getStatus() == JobMatchStatus.COMPLETED
                    || match.getStatus() == JobMatchStatus.FAILED) {

                log.info(
                        "Job match already reached terminal state — matchId={}, status={}",
                        matchId,
                        match.getStatus()
                );

                return;
            }

            Resume resume = match.getResume();
            JobDescription jobDescription = match.getJobDescription();

            // ---------------------------------------------------------
            // 1. Analyze job description
            // ---------------------------------------------------------

            updateStatus(
                    match,
                    JobMatchStatus.ANALYZING_JOB,
                    null
            );

            String jobText = buildJobText(jobDescription);

            if (jobText.isBlank()) {

                throw new JobMatchingException(
                        "Job description does not contain enough information to analyze."
                );
            }

            JobRequirementsDto requirements =
                    extractRequirements(jobText);

            log.info(
                    "Job requirements extracted — matchId={}, required={}, preferred={}, responsibilities={}",
                    matchId,
                    requirements.getRequiredSkills().size(),
                    requirements.getPreferredSkills().size(),
                    requirements.getResponsibilities().size()
            );

            // ---------------------------------------------------------
            // 2. Retrieve resume evidence
            // ---------------------------------------------------------

            updateStatus(
                    match,
                    JobMatchStatus.RETRIEVING_EVIDENCE,
                    null
            );

            List<ResumeEvidence> evidence =
                    retrieveResumeEvidence(
                            resume.getId(),
                            requirements
                    );

            log.info(
                    "Resume evidence retrieved — matchId={}, evidenceCount={}",
                    matchId,
                    evidence.size()
            );

            // ---------------------------------------------------------
            // 3. AI evaluation
            // ---------------------------------------------------------

            updateStatus(
                    match,
                    JobMatchStatus.EVALUATING_MATCH,
                    null
            );

            JobMatchAiEvaluation evaluation =
                    evaluateWithAi(
                            jobDescription,
                            requirements,
                            evidence
                    );

            // ---------------------------------------------------------
            // 4. Deterministic score
            // ---------------------------------------------------------

            updateStatus(
                    match,
                    JobMatchStatus.CALCULATING_SCORE,
                    null
            );

            int finalScore =
                    computeWeightedScore(
                            evaluation,
                            requirements
                    );

            // ---------------------------------------------------------
            // 5. Persist completed result
            // ---------------------------------------------------------

            saveMatch(
                    match,
                    evaluation,
                    finalScore
            );

            log.info(
                    "Job matching completed — matchId={}, resumeId={}, score={}",
                    matchId,
                    resume.getId(),
                    finalScore
            );

        } catch (Exception ex) {

            log.error(
                    "Job matching failed — matchId={}",
                    matchId,
                    ex
            );

            if (match != null) {

                markFailed(
                        match.getId(),
                        ex.getMessage()
                );
            }
        }
    }

    private void updateStatus(
            ResumeJobMatch match,
            JobMatchStatus status,
            String errorMessage) {

        match.setStatus(status);
        match.setErrorMessage(errorMessage);

        resumeJobMatchRepository.save(match);

        log.info(
                "Job match status updated — matchId={}, status={}",
                match.getId(),
                status
        );
    }

    private void markFailed(
            UUID matchId,
            String errorMessage) {

        resumeJobMatchRepository.findById(matchId)
                .ifPresent(match -> {

                    match.setStatus(
                            JobMatchStatus.FAILED
                    );

                    String message =
                            errorMessage == null
                                    || errorMessage.isBlank()
                                    ? "Job matching failed."
                                    : errorMessage;

                    match.setErrorMessage(
                            message.length() > 2000
                                    ? message.substring(0, 2000)
                                    : message
                    );

                    resumeJobMatchRepository.save(match);
                });
    }

    // ============================================================
    // JOB TEXT
    // ============================================================

    private String buildJobText(
            JobDescription jobDescription) {

        StringBuilder text =
                new StringBuilder();

        appendSection(
                text,
                "Job Title",
                jobDescription.getJobTitle()
        );

        appendSection(
                text,
                "Company",
                jobDescription.getCompanyName()
        );

        appendSection(
                text,
                "Job Description",
                jobDescription.getDescription()
        );

        return text.toString().trim();
    }

    private void appendSection(
            StringBuilder builder,
            String label,
            String value) {

        if (value == null || value.isBlank()) {
            return;
        }

        if (!builder.isEmpty()) {
            builder.append("\n\n");
        }

        builder.append(label)
                .append(":\n")
                .append(value.trim());
    }

    // ============================================================
    // REQUIREMENT EXTRACTION
    // ============================================================

    private JobRequirementsDto extractRequirements(
            String normalizedJobDescription) {

        if (normalizedJobDescription == null
                || normalizedJobDescription.isBlank()) {

            return emptyRequirements();
        }

        log.info("Extracting structured job requirements using AI");

        String prompt = """
            You are a job requirement extraction system.

            Analyze ONLY the information explicitly present
            in the supplied job information.

            Do NOT invent or assume requirements.

            Extract:

            1. requiredSkills
               Mandatory technical, domain, or professional skills.

            2. preferredSkills
               Nice-to-have skills or preferred qualifications.

            3. responsibilities
               Important duties, responsibilities, or deliverables.

            4. minYearsExperience
               Minimum required years of experience.
               Return null if not explicitly specified.

            5. education
               Required degree or education.
               Return null if not explicitly specified.

            Important rules:

            - A short job description is valid.
            - Missing information is normal.
            - Do not invent skills.
            - Do not invent years of experience.
            - Do not invent education.
            - Do not invent responsibilities.
            - Do not invent certifications.
            - Do not infer requirements merely because they are
              common for the job title.
            - If a list is not present, return [].
            - If an optional scalar is not present, return null.

            Return ONLY valid JSON.
            Do not include markdown.
            Do not include explanations.
            Do not include text before or after the JSON.

            {
              "requiredSkills": [],
              "preferredSkills": [],
              "responsibilities": [],
              "minYearsExperience": null,
              "education": null
            }

            Job Information:

            """ + normalizedJobDescription;

        try {

            JobRequirementsDto result =
                    chatClient.prompt()
                            .user(prompt)
                            .call()
                            .entity(
                                    JobRequirementsDto.class,
                                    spec -> spec.validateSchema()
                            );

            return normalizeRequirements(result);

        } catch (Exception ex) {

            log.error(
                    "Job requirement extraction failed",
                    ex
            );

            throw new RequirementExtractionException(
                    "Failed to extract job requirements",
                    ex
            );
        }
    }

    private JobRequirementsDto normalizeRequirements(
            JobRequirementsDto requirements) {

        if (requirements == null) {
            return emptyRequirements();
        }

        return JobRequirementsDto.builder()
                .requiredSkills(
                        cleanList(
                                requirements.getRequiredSkills()
                        )
                )
                .preferredSkills(
                        cleanList(
                                requirements.getPreferredSkills()
                        )
                )
                .responsibilities(
                        cleanList(
                                requirements.getResponsibilities()
                        )
                )
                .minYearsExperience(
                        requirements.getMinYearsExperience()
                )
                .education(
                        trimToNull(
                                requirements.getEducation()
                        )
                )
                .build();
    }

    private JobRequirementsDto emptyRequirements() {

        return JobRequirementsDto.builder()
                .requiredSkills(List.of())
                .preferredSkills(List.of())
                .responsibilities(List.of())
                .build();
    }

    // ============================================================
    // VECTOR EVIDENCE
    // ============================================================
    private List<ResumeEvidence> retrieveResumeEvidence(
            UUID resumeId,
            JobRequirementsDto requirements) {

        Set<String> queries = new LinkedHashSet<>();

        /*
         * Keep the number of vector-search queries bounded.
         *
         * We don't need to perform a separate search for every single
         * extracted requirement. A job can easily contain dozens of
         * requirements, which would create an unnecessarily large
         * evidence set.
         */

        addLimitedQueries(
                queries,
                requirements.getRequiredSkills(),
                10
        );

        addLimitedQueries(
                queries,
                requirements.getPreferredSkills(),
                5
        );

        addLimitedQueries(
                queries,
                requirements.getResponsibilities(),
                5
        );

        if (queries.isEmpty()) {
            return List.of();
        }

        /*
         * Hard limit on the total evidence passed to the AI.
         *
         * 20 queries × topK 2 could produce 40 documents,
         * but we only send the strongest 30.
         */
        final int maxEvidence = 30;
        final int topK = 2;

        String filterExpression =
                String.format(
                        "resumeId == '%s'",
                        resumeId
                );

        List<ResumeEvidence> evidence =
                new ArrayList<>();

        for (String query : queries) {

            if (query == null || query.isBlank()) {
                continue;
            }

            /*
             * Stop once we have enough evidence.
             */
            if (evidence.size() >= maxEvidence) {
                break;
            }

            SearchRequest searchRequest =
                    SearchRequest.builder()
                            .query(query)
                            .topK(topK)
                            .filterExpression(filterExpression)
                            .build();

            List<Document> documents;

            try {

                documents =
                        vectorStore.similaritySearch(
                                searchRequest
                        );

            } catch (Exception ex) {

                /*
                 * One failed vector query should not destroy
                 * the complete job match.
                 */
                log.warn(
                        "Vector search failed — requirement='{}', error={}",
                        query,
                        ex.getMessage()
                );

                continue;
            }

            if (documents == null || documents.isEmpty()) {
                continue;
            }

            for (Document document : documents) {

                if (evidence.size() >= maxEvidence) {
                    break;
                }

                Map<String, Object> metadata =
                        document.getMetadata();

                String section =
                        extractSection(metadata);

                Double score =
                        extractScore(metadata);

                String snippet =
                        document.getText();

                /*
                 * Prevent a single huge resume chunk from
                 * making the AI prompt unnecessarily large.
                 */
                if (snippet != null && snippet.length() > 1200) {
                    snippet =
                            snippet.substring(0, 1200) + "...";
                }

                evidence.add(
                        ResumeEvidence.builder()
                                .requirement(query)
                                .section(section)
                                .snippet(snippet)
                                .score(score)
                                .build()
                );
            }
        }

        log.info(
                "Resume evidence retrieval completed — resumeId={}, queries={}, evidence={}",
                resumeId,
                queries.size(),
                evidence.size()
        );

        return evidence;
    }
    private void addLimitedQueries(
            Set<String> target,
            List<String> values,
            int limit) {

        if (values == null || values.isEmpty()) {
            return;
        }

        int added = 0;

        for (String value : values) {

            if (added >= limit) {
                break;
            }

            if (value == null || value.isBlank()) {
                continue;
            }

            String cleaned = value.trim();

            if (target.add(cleaned)) {
                added++;
            }
        }
    }
    private String extractSection(
            Map<String, Object> metadata) {

        if (metadata == null) {
            return "GENERAL";
        }

        Object section =
                metadata.get("section");

        return section == null
                ? "GENERAL"
                : String.valueOf(section);
    }

    private Double extractScore(
            Map<String, Object> metadata) {

        if (metadata == null) {
            return null;
        }

        Object score =
                metadata.get("score");

        if (score instanceof Number number) {
            return number.doubleValue();
        }

        return null;
    }

    // ============================================================
    // AI MATCH EVALUATION
    // ============================================================

    private JobMatchAiEvaluation evaluateWithAi(
            JobDescription jobDescription,
            JobRequirementsDto requirements,
            List<ResumeEvidence> evidenceList) {

        String evidenceText =
                buildEvidenceText(evidenceList);

        String prompt =
                buildEvaluationPrompt(
                        jobDescription,
                        requirements,
                        evidenceText
                );

        try {

            /*
             * IMPORTANT:
             *
             * This is ONE AI request.
             *
             * Do not call .call() once for raw content and then
             * call ChatClient again for .entity().
             */
            JobMatchAiEvaluation evaluation =
                    chatClient.prompt()
                            .user(prompt)
                            .call()
                            .entity(
                                    JobMatchAiEvaluation.class,
                                    ChatClient.EntityParamSpec::validateSchema
                            );

            if (evaluation == null) {
                return emptyEvaluation();
            }

            return normalizeEvaluation(evaluation);

        } catch (Exception ex) {

            log.error(
                    "AI matching evaluation failed",
                    ex
            );

            throw new JobMatchingException(
                    "Failed to evaluate job match"
            );
        }
    }

    private String buildEvidenceText(
            List<ResumeEvidence> evidenceList) {

        if (evidenceList == null
                || evidenceList.isEmpty()) {

            return "No direct evidence chunks found.";
        }

        StringBuilder text =
                new StringBuilder();

        for (ResumeEvidence evidence : evidenceList) {

            text.append(
                    String.format(
                            "- Requirement [%s] found in section [%s]: %s%n",
                            evidence.getRequirement(),
                            evidence.getSection(),
                            evidence.getSnippet()
                    )
            );
        }

        return text.toString();
    }

    private String buildEvaluationPrompt(
            JobDescription jobDescription,
            JobRequirementsDto requirements,
            String evidenceText) {

        return String.format(
                """
                You are a professional resume-to-job matching assistant.

                Analyze ONLY the supplied job requirements and
                supplied resume evidence.

                Do NOT invent resume experience.

                Job Title:
                %s

                Company:
                %s

                Required Skills:
                %s

                Preferred Skills:
                %s

                Responsibilities:
                %s

                Minimum Experience:
                %s

                Education:
                %s

                Resume Evidence:
                %s

                Matching rules:

                For required/preferred skills:

                - MATCH = clearly supported by resume evidence.
                - PARTIAL_MATCH = partially supported.
                - MISSING = not supported.

                For responsibilities:

                Determine which responsibilities are supported
                by the supplied resume evidence.

                Do not treat missing optional job information
                as a mismatch.

                Do not invent missing requirements.

                Return ONLY valid JSON:

                {
                  "summary": "...",
                  "matchingSkills": [
                    {
                      "skill": "Java",
                      "matchType": "MATCH",
                      "evidence": "..."
                    }
                  ],
                  "missingSkills": [
                    {
                      "skill": "Kubernetes",
                      "importance": "PREFERRED",
                      "suggestion": "..."
                    }
                  ],
                  "matchingResponsibilities": [
                    {
                      "skill": "Develop REST APIs",
                      "matchType": "MATCH",
                      "evidence": "..."
                    }
                  ],
                  "recommendations": [
                    "..."
                  ]
                }

                If there are no matching skills,
                return an empty matchingSkills array.

                If there are no missing skills,
                return an empty missingSkills array.

                If there are no responsibilities,
                return an empty matchingResponsibilities array.

                Job Description:
                %s
                """,
                safeString(jobDescription.getJobTitle()),
                safeString(jobDescription.getCompanyName()),
                requirements.getRequiredSkills(),
                requirements.getPreferredSkills(),
                requirements.getResponsibilities(),
                requirements.getMinYearsExperience(),
                safeString(requirements.getEducation()),
                evidenceText,
                safeString(jobDescription.getDescription())
        );
    }

    private JobMatchAiEvaluation normalizeEvaluation(
            JobMatchAiEvaluation evaluation) {

        return new JobMatchAiEvaluation(
                evaluation.summary() != null
                        ? evaluation.summary()
                        : "Match evaluation completed.",

                safeMatchingSkills(
                        evaluation.matchingSkills()
                ),

                safeMissingSkills(
                        evaluation.missingSkills()
                ),

                safeMatchingSkills(
                        evaluation.matchingResponsibilities()
                ),

                safeStrings(
                        evaluation.recommendations()
                )
        );
    }

    private JobMatchAiEvaluation emptyEvaluation() {

        return new JobMatchAiEvaluation(
                "Not enough matching information was available.",
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
    }

    // ============================================================
    // DETERMINISTIC SCORING
    // ============================================================

    private int computeWeightedScore(
            JobMatchAiEvaluation evaluation,
            JobRequirementsDto requirements) {

        double requiredWeight =
                matchingProperties.getRequiredSkillsWeight();

        double preferredWeight =
                matchingProperties.getPreferredSkillsWeight();

        double responsibilityWeight =
                matchingProperties.getResponsibilitiesWeight();

        int requiredCount =
                cleanList(
                        requirements.getRequiredSkills()
                ).size();

        int preferredCount =
                cleanList(
                        requirements.getPreferredSkills()
                ).size();

        int responsibilityCount =
                cleanList(
                        requirements.getResponsibilities()
                ).size();

        double weightedScore = 0.0;
        double availableWeight = 0.0;

        if (requiredCount > 0) {

            double ratio =
                    calculateRatio(
                            requirements.getRequiredSkills(),
                            evaluation.matchingSkills()
                    );

            weightedScore +=
                    ratio * requiredWeight;

            availableWeight += requiredWeight;
        }

        if (preferredCount > 0) {

            double ratio =
                    calculateRatio(
                            requirements.getPreferredSkills(),
                            evaluation.matchingSkills()
                    );

            weightedScore +=
                    ratio * preferredWeight;

            availableWeight += preferredWeight;
        }

        if (responsibilityCount > 0) {

            double ratio =
                    calculateRatio(
                            requirements.getResponsibilities(),
                            evaluation.matchingResponsibilities()
                    );

            weightedScore +=
                    ratio * responsibilityWeight;

            availableWeight += responsibilityWeight;
        }

        if (availableWeight <= 0.0) {

            log.info(
                    "No scoreable requirements found in job description."
            );

            return 0;
        }

        double normalizedScore =
                (weightedScore / availableWeight) * 100.0;

        return (int) Math.round(
                Math.max(
                        0,
                        Math.min(
                                100,
                                normalizedScore
                        )
                )
        );
    }

    private double calculateRatio(
            List<String> requirements,
            List<MatchingSkill> matches) {

        List<String> safeRequirements =
                cleanList(requirements);

        if (safeRequirements.isEmpty()) {
            return 0.0;
        }

        List<MatchingSkill> safeMatches =
                safeMatchingSkills(matches);

        double totalScore = 0.0;

        for (String requirement : safeRequirements) {

            MatchingSkill bestMatch =
                    safeMatches.stream()
                            .filter(match ->
                                    match != null
                                            && match.getSkill() != null
                                            && isSameRequirement(
                                            requirement,
                                            match.getSkill()
                                    )
                            )
                            .findFirst()
                            .orElse(null);

            if (bestMatch == null) {
                continue;
            }

            MatchType type =
                    bestMatch.getMatchType();

            if (type == MatchType.MATCH) {
                totalScore += 1.0;
            } else if (type == MatchType.PARTIAL_MATCH) {
                totalScore += 0.5;
            }
        }

        return Math.min(
                1.0,
                totalScore / safeRequirements.size()
        );
    }

    private boolean isSameRequirement(
            String first,
            String second) {

        String a =
                normalizeForComparison(first);

        String b =
                normalizeForComparison(second);

        if (a.isBlank() || b.isBlank()) {
            return false;
        }

        return a.equals(b)
                || a.startsWith(b + " ")
                || b.startsWith(a + " ");
    }

    private String normalizeForComparison(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    // ============================================================
    // PERSISTENCE
    // ============================================================

    private void saveMatch(
            ResumeJobMatch match,
            JobMatchAiEvaluation evaluation,
            int finalScore) {

        List<MatchingSkill> matchingSkills =
                safeMatchingSkills(
                        evaluation.matchingSkills()
                );

        List<MissingSkill> missingSkills =
                safeMissingSkills(
                        evaluation.missingSkills()
                );

        List<String> recommendations =
                safeStrings(
                        evaluation.recommendations()
                );

        String matchedKeywords =
                matchingSkills.stream()
                        .map(MatchingSkill::getSkill)
                        .filter(
                                skill ->
                                        skill != null
                                                && !skill.isBlank()
                        )
                        .distinct()
                        .reduce(
                                (a, b) -> a + ", " + b
                        )
                        .orElse("");

        String missingKeywords =
                missingSkills.stream()
                        .map(MissingSkill::getSkill)
                        .filter(
                                skill ->
                                        skill != null
                                                && !skill.isBlank()
                        )
                        .distinct()
                        .reduce(
                                (a, b) -> a + ", " + b
                        )
                        .orElse("");

        match.setMatchPercentage(
                (double) finalScore
        );

        match.setMatchedKeywords(
                matchedKeywords
        );

        match.setMissingKeywords(
                missingKeywords
        );

        match.setRecommendations(
                String.join(
                        "; ",
                        recommendations
                )
        );

        match.setOptimizedSummary(
                evaluation.summary()
        );

        match.setErrorMessage(null);

        match.setStatus(
                JobMatchStatus.COMPLETED
        );

        resumeJobMatchRepository.save(match);
    }

    // ============================================================
    // SAFE HELPERS
    // ============================================================

    private List<String> cleanList(
            List<String> values) {

        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(
                        value ->
                                value != null
                                        && !value.isBlank()
                )
                .map(String::trim)
                .distinct()
                .toList();
    }

    private List<MatchingSkill> safeMatchingSkills(
            List<MatchingSkill> values) {

        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(value -> value != null)
                .filter(
                        value ->
                                value.getSkill() != null
                                        && !value.getSkill().isBlank()
                )
                .toList();
    }

    private List<MissingSkill> safeMissingSkills(
            List<MissingSkill> values) {

        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .filter(value -> value != null)
                .filter(
                        value ->
                                value.getSkill() != null
                                        && !value.getSkill().isBlank()
                )
                .toList();
    }

    private List<String> safeStrings(
            List<String> values) {

        return cleanList(values);
    }

    private String trimToNull(
            String value) {

        if (value == null) {
            return null;
        }

        String trimmed =
                value.trim();

        return trimmed.isEmpty()
                ? null
                : trimmed;
    }

    private String safeString(
            String value) {

        return value == null
                || value.isBlank()
                ? "Not specified"
                : value;
    }

    // ============================================================
    // AI RESULT
    // ============================================================

    public record JobMatchAiEvaluation(
            String summary,
            List<MatchingSkill> matchingSkills,
            List<MissingSkill> missingSkills,
            List<MatchingSkill> matchingResponsibilities,
            List<String> recommendations
    ) {
    }

}
