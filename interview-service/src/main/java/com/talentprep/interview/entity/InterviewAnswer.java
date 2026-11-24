package com.talentprep.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private InterviewQuestion question;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "code_submission", columnDefinition = "TEXT")
    private String codeSubmission;

    @Column(name = "language", length = 30)
    private String language;

    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds;

    @Column(name = "client_request_id", length = 100)
    private String clientRequestId;

    @Column(name = "evaluation_status", length = 50)
    @Builder.Default
    private String evaluationStatus = "PENDING";

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @OneToOne(mappedBy = "answer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private AnswerEvaluation evaluation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
