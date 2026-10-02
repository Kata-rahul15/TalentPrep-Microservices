package com.Resume.Ai.Entity;

import com.Resume.Ai.dto.AtsSuggestion;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Persisted resume-level AI evaluation generated once during resume upload.
 * Subsequent overview/ATS requests read this data and do not invoke the LLM.
 */
@Entity
@Table(name = "resume_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    private Resume resume;

    @Column(nullable = false)
    private Integer atsScore;

    @Column(nullable = false)
    private Integer keywordMatch;

    @Column(nullable = false)
    private Integer formattingScore;

    @Column(nullable = false)
    private Integer technicalSkillsScore;

    @Column(nullable = false)
    private Integer experienceScore;

    @Column(nullable = false)
    private Integer educationScore;

    @Column(nullable = false)
    private Integer overallScore;

    @Column(columnDefinition = "TEXT")
    private String aiInsight;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> strengths = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> weaknesses = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<AtsSuggestion> suggestions = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> missingKeywords = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> keyHighlights = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<AtsSuggestion> topRecommendations = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime evaluatedAt;
}
