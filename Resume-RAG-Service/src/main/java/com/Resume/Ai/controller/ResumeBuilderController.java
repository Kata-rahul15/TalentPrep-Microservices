package com.Resume.Ai.controller;

import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Entity.ResumeSection;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.Repositories.ResumeSectionRepository;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeBuilderController {
    private static final String AUTH_USER_ID_HEADER = "X-Authenticated-User-Id";
    private static final String FALLBACK_USER_ID_HEADER = "X-User-Id";

    private final ResumeRepository resumes;
    private final ResumeSectionRepository sections;
    private final ObjectMapper mapper;

    public ResumeBuilderController(ResumeRepository resumes, ResumeSectionRepository sections, ObjectMapper mapper) {
        this.resumes = resumes;
        this.sections = sections;
        this.mapper = mapper;
    }

    @PostMapping("/builder")
    public ResponseEntity<BuilderResponse> createBuilder(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallback,
            @RequestBody(required = false) JsonNode content) {
        UUID userId = resolveUserId(authenticated, fallback);
        JsonNode safeContent = normalizeContent(content);

        Resume resume = Resume.builder()
                .userId(userId)
                .resumeName(text(safeContent, "title", "My Professional Resume"))
                .originalFilename("builder-resume.json")
                .storedFilename("builder-resume-" + UUID.randomUUID() + ".json")
                .storagePath("builder")
                .fileSize(0L)
                .mimeType("application/json")
                .status(com.Resume.Ai.enums.ResumeStatus.READY)
                .version(1)
                .active(true)
                .build();
        resume = resumes.save(resume);

        ResumeSection section = ResumeSection.builder()
                .resume(resume)
                .summary(text(safeContent, "summary", ""))
                .builderContent(toBuilderMap(safeContent))
                .build();
        sections.save(section);

        return ResponseEntity.status(HttpStatus.CREATED).body(new BuilderResponse(resume.getId(), safeContent, Instant.now().toString()));
    }

    @GetMapping("/{resumeId}/builder")
    public ResponseEntity<BuilderResponse> getBuilder(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId) {
        UUID userId = resolveUserId(authenticated, fallback);
        Resume resume = ownedResume(resumeId, userId);
        ResumeSection section = sections.findByResume_Id(resumeId).orElse(null);
        JsonNode content = section == null || section.getBuilderContent() == null
                ? null
                : mapper.valueToTree(section.getBuilderContent());
        if (content == null || content.isNull()) {
            content = deriveContent(resume, section);
        }
        return ResponseEntity.ok(new BuilderResponse(resumeId, content, resume.getUpdatedAt() == null ? null : resume.getUpdatedAt().toString()));
    }

    @PutMapping("/{resumeId}/builder")
    public ResponseEntity<BuilderResponse> saveBuilder(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId,
            @RequestBody JsonNode content) {
        UUID userId = resolveUserId(authenticated, fallback);
        Resume resume = ownedResume(resumeId, userId);
        JsonNode safeContent = normalizeContent(content);
        ResumeSection section = sections.findByResume_Id(resumeId).orElseGet(() -> {
            ResumeSection created = new ResumeSection();
            created.setResume(resume);
            return created;
        });
        section.setBuilderContent(toBuilderMap(safeContent));
        section.setSummary(text(safeContent, "summary", section.getSummary()));
        sections.save(section);

        String title = text(safeContent, "title", null);
        if (title != null && !title.isBlank()) resume.setResumeName(title.trim());
        resumes.save(resume);
        return ResponseEntity.ok(new BuilderResponse(resumeId, safeContent, Instant.now().toString()));
    }

    private UUID resolveUserId(UUID authenticated, UUID fallback) {
        UUID id = authenticated != null ? authenticated : fallback;
        if (id == null) throw new IllegalArgumentException("Missing authenticated user identity.");
        return id;
    }

    private Resume ownedResume(UUID resumeId, UUID userId) {
        Resume resume = resumes.findById(resumeId).orElseThrow(() -> new ResumeNotFoundException(resumeId));
        if (!userId.equals(resume.getUserId())) throw new ResumeUnauthorizedAccessException(resumeId, userId);
        return resume;
    }

    private JsonNode normalizeContent(JsonNode content) {
        JsonNode normalized = content == null || content.isNull()
                ? mapper.createObjectNode()
                : content;

        if (!normalized.isObject()) {
            throw new IllegalArgumentException("Builder content must be a JSON object.");
        }
        return normalized;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toBuilderMap(JsonNode content) {
        JsonNode normalized = normalizeContent(content);
        return mapper.convertValue(normalized, Map.class);
    }

    private String text(JsonNode node, String field, String fallback) {
        JsonNode value = node == null ? null : node.get(field);
        return value != null && value.isTextual() ? value.asText() : fallback;
    }

    private JsonNode deriveContent(Resume resume, ResumeSection section) {
        var root = mapper.createObjectNode();
        root.put("id", resume.getId().toString());
        root.put("title", resume.getResumeName());
        root.put("lastModified", resume.getUpdatedAt() == null ? Instant.now().toString() : resume.getUpdatedAt().toString());
        root.put("selectedTemplate", "modern");
        var personal = root.putObject("personalInfo");
        if (section != null && section.getContactDetails() != null) {
            personal.put("fullName", nvl(section.getContactDetails().getName()));
            personal.put("email", nvl(section.getContactDetails().getEmail()));
            personal.put("phone", nvl(section.getContactDetails().getPhone()));
            personal.put("location", nvl(section.getContactDetails().getLocation()));
            personal.put("linkedin", nvl(section.getContactDetails().getLinkedin()));
            personal.put("github", nvl(section.getContactDetails().getGithub()));
            personal.put("portfolio", nvl(section.getContactDetails().getPortfolio()));
        } else {
            personal.put("fullName", ""); personal.put("jobTitle", ""); personal.put("email", "");
            personal.put("phone", ""); personal.put("location", ""); personal.put("linkedin", "");
            personal.put("github", ""); personal.put("portfolio", "");
        }
        root.put("summary", section == null ? "" : nvl(section.getSummary()));
        root.set("experience", mapper.valueToTree(section == null ? java.util.List.of() : section.getExperienceDetails()));
        root.set("education", mapper.valueToTree(section == null ? java.util.List.of() : section.getEducationDetails()));
        var skills = mapper.createArrayNode();
        var skillCategory = mapper.createObjectNode();
        skillCategory.put("id", "skills-1"); skillCategory.put("categoryName", "Skills");
        skillCategory.set("skills", mapper.valueToTree(section == null ? java.util.List.of() : section.getSkillsList()));
        skills.add(skillCategory); root.set("skills", skills);
        root.set("projects", mapper.valueToTree(section == null ? java.util.List.of() : section.getProjects()));
        root.set("certifications", mapper.valueToTree(section == null ? java.util.List.of() : section.getCertificationList()));
        root.set("achievements", mapper.valueToTree(section == null ? java.util.List.of() : section.getAchievementList()));
        root.set("customSections", mapper.createArrayNode());
        root.set("sectionOrder", mapper.valueToTree(java.util.List.of("personal", "summary", "experience", "education", "skills", "projects", "certifications", "achievements", "custom")));
        var visibility = root.putObject("sectionVisibility");
        for (String key : new String[]{"personal","summary","experience","education","skills","projects","certifications","achievements","custom"}) visibility.put(key, true);
        return root;
    }

    private String nvl(String value) { return value == null ? "" : value; }

    public record BuilderResponse(UUID resumeId, JsonNode content, String savedAt) {}
}
