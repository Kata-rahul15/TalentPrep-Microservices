package com.talentprep.interview.usage;

import com.talentprep.interview.entity.InterviewUsage;
import com.talentprep.interview.entity.enums.PlanType;
import com.talentprep.interview.exception.QuotaExceededException;
import com.talentprep.interview.repository.InterviewUsageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class EntitlementService {

    private static final Logger log = LoggerFactory.getLogger(EntitlementService.class);

    private final InterviewUsageRepository usageRepository;
    private final int freeTierLimit;
    private final int proTierLimit;
    private final boolean enforced;

    public EntitlementService(
            InterviewUsageRepository usageRepository,
            int freeTierLimit,
            int proTierLimit) {
        this(usageRepository, freeTierLimit, proTierLimit, true);
    }

    @Autowired
    public EntitlementService(
            InterviewUsageRepository usageRepository,
            @Value("${talentprep.entitlement.free-tier-session-limit:3}") int freeTierLimit,
            @Value("${talentprep.entitlement.pro-tier-monthly-limit:50}") int proTierLimit,
            @Value("${talentprep.entitlement.enforced:false}") boolean enforced) {
        this.usageRepository = usageRepository;
        this.freeTierLimit = freeTierLimit;
        this.proTierLimit = proTierLimit;
        this.enforced = enforced;
    }

    public boolean isEnforced() {
        return enforced;
    }

    /**
     * Atomically locks the user's usage record and checks quota before reserving a session.
     * Prevents race conditions from simultaneous requests.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public InterviewUsage reserveSessionQuota(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID must not be null.");
        }
        if (!enforced) {
            log.debug("Entitlement enforcement disabled; granting unlimited interview access for user {}", userId);
            return getUserUsage(userId);
        }

        InterviewUsage usage = getOrCreateUsageWithLock(userId);
        checkAndApplyRenewalReset(usage);

        int totalCommitted = usage.getSessionsReserved() + usage.getSessionsConsumed();
        int maxAllowed = (usage.getPlanType() == PlanType.PRO)
                ? usage.getMonthlyAllowance()
                : freeTierLimit;

        if (totalCommitted >= maxAllowed) {
            log.warn("Quota exceeded for user {}: totalCommitted={}, maxAllowed={}, plan={}",
                    userId, totalCommitted, maxAllowed, usage.getPlanType());
            throw new QuotaExceededException(
                    String.format("You have reached your interview session limit of %d sessions for the %s plan.",
                            maxAllowed, usage.getPlanType())
            );
        }

        usage.setSessionsReserved(usage.getSessionsReserved() + 1);
        InterviewUsage saved = usageRepository.save(usage);
        log.info("Reserved session quota for user {}: reserved={}, consumed={}, plan={}",
                userId, saved.getSessionsReserved(), saved.getSessionsConsumed(), saved.getPlanType());
        return saved;
    }

    /**
     * Transitions a reserved session to consumed (e.g. when candidate starts or submits first answer).
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void consumeSessionQuota(UUID userId) {
        if (userId == null || !enforced) return;

        InterviewUsage usage = getOrCreateUsageWithLock(userId);
        if (usage.getSessionsReserved() > 0) {
            usage.setSessionsReserved(usage.getSessionsReserved() - 1);
            usage.setSessionsConsumed(usage.getSessionsConsumed() + 1);
            usageRepository.save(usage);
            log.info("Consumed session quota for user {}: reserved={}, consumed={}",
                    userId, usage.getSessionsReserved(), usage.getSessionsConsumed());
        }
    }

    /**
     * Releases a reserved session back to available quota if session is cancelled before consumption.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void releaseReservation(UUID userId) {
        if (userId == null || !enforced) return;

        InterviewUsage usage = getOrCreateUsageWithLock(userId);
        if (usage.getSessionsReserved() > 0) {
            usage.setSessionsReserved(usage.getSessionsReserved() - 1);
            usageRepository.save(usage);
            log.info("Released session reservation for user {}: reserved={}, consumed={}",
                    userId, usage.getSessionsReserved(), usage.getSessionsConsumed());
        }
    }

    @Transactional(readOnly = true)
    public InterviewUsage getUserUsage(UUID userId) {
        return usageRepository.findByUserId(userId)
                .orElseGet(() -> InterviewUsage.builder()
                        .userId(userId)
                        .planType(PlanType.FREE)
                        .sessionsReserved(0)
                        .sessionsConsumed(0)
                        .monthlyAllowance(freeTierLimit)
                        .build());
    }

    private InterviewUsage getOrCreateUsageWithLock(UUID userId) {
        return usageRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> {
                    InterviewUsage newUsage = InterviewUsage.builder()
                            .userId(userId)
                            .planType(PlanType.FREE)
                            .sessionsReserved(0)
                            .sessionsConsumed(0)
                            .monthlyAllowance(freeTierLimit)
                            .build();
                    return usageRepository.save(newUsage);
                });
    }

    private void checkAndApplyRenewalReset(InterviewUsage usage) {
        if (usage.getPlanType() == PlanType.PRO && usage.getPlanRenewalDate() != null) {
            if (LocalDateTime.now().isAfter(usage.getPlanRenewalDate())) {
                log.info("Pro monthly quota renewed for user {}", usage.getUserId());
                usage.setSessionsConsumed(0);
                usage.setSessionsReserved(0);
                usage.setPlanRenewalDate(usage.getPlanRenewalDate().plusMonths(1));
                usageRepository.save(usage);
            }
        }
    }
}

