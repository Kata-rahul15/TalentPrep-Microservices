package com.talentprep.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "answer_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private InterviewAnswer answer;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "technical_accuracy")
    private Integer technicalAccuracy;

    @Column(name = "completeness")
    private Integer completeness;

    @Column(name = "clarity")
    private Integer clarity;

    @Column(name = "problem_solving")
    private Integer problemSolving;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> strengths = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> improvements = new ArrayList<>();

    @Column(name = "suggested_ideal_answer", columnDefinition = "TEXT")
    private String suggestedIdealAnswer;

    @Column(name = "triggers_follow_up", nullable = false)
    @Builder.Default
    private Boolean triggersFollowUp = false;

    @Column(name = "follow_up_reason", columnDefinition = "TEXT")
    private String followUpReason;

    @Column(name = "evaluation_model")
    private String evaluationModel;

    @Column(name = "evaluation_version")
    private String evaluationVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "execution_metrics", columnDefinition = "jsonb")
    private Map<String, Object> executionMetrics;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
