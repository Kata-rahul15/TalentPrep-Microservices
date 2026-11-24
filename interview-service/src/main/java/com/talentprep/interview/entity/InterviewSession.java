package com.talentprep.interview.entity;

import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.InterviewMode;
import com.talentprep.interview.entity.enums.InterviewStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "interview_sessions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_interview_sessions_user_idempotency",
                        columnNames = {"user_id", "idempotency_key"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private CandidateContextSnapshot snapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DifficultyLevel difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewMode mode;

    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "target_job_description", columnDefinition = "TEXT")
    private String targetJobDescription;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 45;

    @Column(name = "current_round_index")
    @Builder.Default
    private Integer currentRoundIndex = 0;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "paused_at")
    private LocalDateTime pausedAt;

    @Column(name = "total_paused_seconds", nullable = false)
    @Builder.Default
    private Long totalPausedSeconds = 0L;

    @Column(name = "current_question_id")
    private UUID currentQuestionId;

    @Column(name = "turn_sequence", nullable = false)
    @Builder.Default
    private Integer turnSequence = 0;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("roundOrder ASC")
    @Builder.Default
    private List<InterviewRound> rounds = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public long computeRemainingSeconds(LocalDateTime now) {
        long allowedSeconds = (durationMinutes != null && durationMinutes > 0 ? durationMinutes : 45) * 60L;
        if (status == InterviewStatus.CREATED || startedAt == null) {
            return allowedSeconds;
        }
        if (status == InterviewStatus.COMPLETED || status == InterviewStatus.REPORT_GENERATED) {
            return 0L;
        }
        LocalDateTime referenceTime = (status == InterviewStatus.PAUSED && pausedAt != null) ? pausedAt : now;
        long wallElapsed = Math.max(0L, Duration.between(startedAt, referenceTime).getSeconds());
        long paused = totalPausedSeconds != null ? Math.max(0L, totalPausedSeconds) : 0L;
        long activeElapsed = Math.max(0L, wallElapsed - paused);
        return Math.max(0L, allowedSeconds - activeElapsed);
    }

    public LocalDateTime computeEffectiveEndsAt() {
        if (startedAt == null) {
            return null;
        }
        if (status == InterviewStatus.COMPLETED || status == InterviewStatus.REPORT_GENERATED) {
            return completedAt;
        }
        if (status == InterviewStatus.PAUSED) {
            return null;
        }
        long allowedSeconds = (durationMinutes != null && durationMinutes > 0 ? durationMinutes : 45) * 60L;
        long paused = totalPausedSeconds != null ? Math.max(0L, totalPausedSeconds) : 0L;
        return startedAt.plusSeconds(allowedSeconds + paused);
    }

    public boolean isTimeExpired(LocalDateTime now) {
        if (status != InterviewStatus.IN_PROGRESS && status != InterviewStatus.ROUND_TRANSITION) {
            return false;
        }
        return startedAt != null && computeRemainingSeconds(now) <= 0L;
    }
}

