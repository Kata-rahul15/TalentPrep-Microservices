package com.Resume.Ai.Entity;

import com.Resume.Ai.dto.ContactDetails;
import com.Resume.Ai.dto.EducationDetails;
import com.Resume.Ai.dto.ExperienceDetails;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Structured resume content produced by ResumeAiAnalyzer during ingestion.
 *
 * The existing text fields are retained for compatibility with the current
 * details UI and RAG pipeline. The JSONB fields preserve the richer semantic
 * structure returned by the single AI analysis call.
 */
@Entity
@Table(name = "resume_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeSection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String education;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<EducationDetails> educationDetails = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String experience;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<ExperienceDetails> experienceDetails = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<ProjectDetails> projects = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String skills;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> skillsList = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String certifications;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> certificationList = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String achievements;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> achievementList = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String languages;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> languageList = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String contactInformation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private ContactDetails contactDetails;
}
