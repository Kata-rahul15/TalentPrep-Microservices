package com.talentprep.interview.entity;

import com.talentprep.interview.entity.enums.PlanType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview_usage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false)
    @Builder.Default
    private PlanType planType = PlanType.FREE;

    @Column(name = "sessions_reserved", nullable = false)
    @Builder.Default
    private Integer sessionsReserved = 0;

    @Column(name = "sessions_consumed", nullable = false)
    @Builder.Default
    private Integer sessionsConsumed = 0;

    @Column(name = "monthly_allowance", nullable = false)
    @Builder.Default
    private Integer monthlyAllowance = 3;

    @Column(name = "plan_renewal_date")
    private LocalDateTime planRenewalDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

