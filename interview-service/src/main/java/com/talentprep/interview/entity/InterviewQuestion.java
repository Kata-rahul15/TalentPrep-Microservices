package com.talentprep.interview.entity;

import com.talentprep.interview.entity.enums.QuestionStatus;
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
@Table(name = "interview_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private InterviewRound round;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "question_category")
    private String questionCategory;

    @Column(name = "difficulty")
    private String difficulty;

    @Column(name = "is_follow_up")
    @Builder.Default
    private Boolean isFollowUp = false;

    @Column(name = "parent_question_id")
    private UUID parentQuestionId;

    @Column(name = "depth", nullable = false)
    @Builder.Default
    private Integer depth = 0;

    @Column(name = "topic", length = 100)
    private String topic;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    /** Last authoritative follow-up decision for this root question. */
    @Column(name = "follow_up_decision", length = 30)
    private String followUpDecision;

    /** Root question this asynchronously prepared main question follows. */
    @Column(name = "prepared_for_question_id")
    private UUID preparedForQuestionId;

    @Column(name = "triggering_answer_id")
    private UUID triggeringAnswerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_status", nullable = false)
    @Builder.Default
    private QuestionStatus questionStatus = QuestionStatus.PENDING;

    @Column(name = "coding_boilerplate", columnDefinition = "TEXT")
    private String codingBoilerplate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "coding_test_cases", columnDefinition = "jsonb")
    private List<Map<String, Object>> codingTestCases;

    @Column(name = "coding_problem_id")
    private UUID codingProblemId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "coding_hidden_test_cases", columnDefinition = "jsonb")
    private List<Map<String, Object>> codingHiddenTestCases;

    @OneToOne(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private InterviewAnswer answer;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

