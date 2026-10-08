package com.Resume.Ai.builder;

import com.Resume.Ai.Entity.Resume;
import com.Resume.Ai.Entity.ResumeSection;
import com.Resume.Ai.Entity.ResumeVersion;
import com.Resume.Ai.Repositories.ResumeRepository;
import com.Resume.Ai.Repositories.ResumeSectionRepository;
import com.Resume.Ai.Repositories.ResumeVersionRepository;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ResumeVersionService {
    private final ResumeRepository resumes;
    private final ResumeSectionRepository sections;
    private final ResumeVersionRepository versions;
    private final ObjectMapper mapper;

    public ResumeVersionService(ResumeRepository resumes, ResumeSectionRepository sections,
                                ResumeVersionRepository versions, ObjectMapper mapper) {
        this.resumes = resumes;
        this.sections = sections;
        this.versions = versions;
        this.mapper = mapper;
    }

    @Transactional
    public ResumeVersionResponse create(UUID resumeId, UUID userId, String label) {
        Resume resume = ownedResume(resumeId, userId);
        ResumeSection section = sections.findByResume_Id(resumeId)
                .orElseThrow(() -> new IllegalStateException("Resume content is not available yet."));
        int next = versions.findTopByResume_IdOrderByVersionNumberDesc(resumeId)
                .map(v -> v.getVersionNumber() + 1).orElse(1);
        try {
            ResumeVersion saved = versions.save(ResumeVersion.builder()
                    .resume(resume).versionNumber(next).label(normalizeLabel(label))
                    .snapshotJson(mapper.writeValueAsString(toSnapshot(section))).build());
            return toResponse(saved);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize resume snapshot.", ex);
        }
    }

    @Transactional(readOnly = true)
    public List<ResumeVersionResponse> list(UUID resumeId, UUID userId) {
        ownedResume(resumeId, userId);
        return versions.findAllByResume_IdOrderByVersionNumberDesc(resumeId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ResumeVersionResponse restore(UUID resumeId, UUID versionId, UUID userId) {
        Resume resume = ownedResume(resumeId, userId);
        ResumeVersion source = versions.findByIdAndResume_Id(versionId, resumeId)
                .orElseThrow(() -> new ResumeNotFoundException(versionId));
        try {
            ResumeContentSnapshot snapshot = mapper.readValue(source.getSnapshotJson(), ResumeContentSnapshot.class);
            ResumeSection section = sections.findByResume_Id(resumeId).orElseGet(() -> {
                ResumeSection created = new ResumeSection();
                created.setResume(resume);
                return created;
            });
            applySnapshot(section, snapshot);
            sections.save(section);
            return create(resumeId, userId, "Restored from version " + source.getVersionNumber());
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stored resume version is invalid.", ex);
        }
    }

    private Resume ownedResume(UUID resumeId, UUID userId) {
        Resume resume = resumes.findById(resumeId).orElseThrow(() -> new ResumeNotFoundException(resumeId));
        if (!userId.equals(resume.getUserId())) throw new ResumeUnauthorizedAccessException(resumeId, userId);
        return resume;
    }

    private ResumeContentSnapshot toSnapshot(ResumeSection s) {
        return ResumeContentSnapshot.builder().summary(s.getSummary()).education(s.getEducation())
                .educationDetails(s.getEducationDetails()).experience(s.getExperience())
                .experienceDetails(s.getExperienceDetails()).projects(s.getProjects()).skills(s.getSkills())
                .skillsList(s.getSkillsList()).certifications(s.getCertifications())
                .certificationList(s.getCertificationList()).achievements(s.getAchievements())
                .achievementList(s.getAchievementList()).languages(s.getLanguages())
                .languageList(s.getLanguageList()).contactInformation(s.getContactInformation())
                .contactDetails(s.getContactDetails()).builderContent(s.getBuilderContent()).build();
    }

    private void applySnapshot(ResumeSection s, ResumeContentSnapshot v) {
        s.setSummary(v.getSummary()); s.setEducation(v.getEducation()); s.setEducationDetails(v.getEducationDetails());
        s.setExperience(v.getExperience()); s.setExperienceDetails(v.getExperienceDetails()); s.setProjects(v.getProjects());
        s.setSkills(v.getSkills()); s.setSkillsList(v.getSkillsList()); s.setCertifications(v.getCertifications());
        s.setCertificationList(v.getCertificationList()); s.setAchievements(v.getAchievements());
        s.setAchievementList(v.getAchievementList()); s.setLanguages(v.getLanguages()); s.setLanguageList(v.getLanguageList());
        s.setContactInformation(v.getContactInformation()); s.setContactDetails(v.getContactDetails());
        s.setBuilderContent(v.getBuilderContent());
    }

    private String normalizeLabel(String label) {
        if (label == null || label.isBlank()) return "Manual snapshot";
        String trimmed = label.trim();
        return trimmed.length() > 160 ? trimmed.substring(0, 160) : trimmed;
    }

    private ResumeVersionResponse toResponse(ResumeVersion v) {
        return ResumeVersionResponse.builder().id(v.getId()).resumeId(v.getResume().getId())
                .versionNumber(v.getVersionNumber()).label(v.getLabel()).createdAt(v.getCreatedAt()).build();
    }
}
