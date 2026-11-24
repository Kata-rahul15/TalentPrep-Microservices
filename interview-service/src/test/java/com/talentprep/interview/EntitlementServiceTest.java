package com.talentprep.interview;

import com.talentprep.interview.entity.InterviewUsage;
import com.talentprep.interview.entity.enums.PlanType;
import com.talentprep.interview.exception.QuotaExceededException;
import com.talentprep.interview.repository.InterviewUsageRepository;
import com.talentprep.interview.usage.EntitlementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EntitlementServiceTest {

    private InterviewUsageRepository usageRepository;
    private EntitlementService entitlementService;

    @BeforeEach
    void setUp() {
        usageRepository = Mockito.mock(InterviewUsageRepository.class);
        entitlementService = new EntitlementService(usageRepository, 3, 50);
    }

    @Test
    @DisplayName("Successfully reserves quota when below limit")
    void testReserveQuotaSuccess() {
        UUID userId = UUID.randomUUID();
        InterviewUsage usage = InterviewUsage.builder()
                .userId(userId)
                .planType(PlanType.FREE)
                .sessionsReserved(1)
                .sessionsConsumed(1)
                .monthlyAllowance(3)
                .build();

        when(usageRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(usage));
        when(usageRepository.save(any(InterviewUsage.class))).thenAnswer(i -> i.getArgument(0));

        InterviewUsage result = entitlementService.reserveSessionQuota(userId);

        assertNotNull(result);
        assertEquals(2, result.getSessionsReserved());
        assertEquals(1, result.getSessionsConsumed());
        verify(usageRepository).save(usage);
    }

    @Test
    @DisplayName("Throws QuotaExceededException when Free tier limit of 3 sessions is reached")
    void testReserveQuotaExceeded() {
        UUID userId = UUID.randomUUID();
        InterviewUsage usage = InterviewUsage.builder()
                .userId(userId)
                .planType(PlanType.FREE)
                .sessionsReserved(1)
                .sessionsConsumed(2)
                .monthlyAllowance(3)
                .build();

        when(usageRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(usage));

        assertThrows(QuotaExceededException.class, () -> entitlementService.reserveSessionQuota(userId));
        verify(usageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Consumes reservation when interview formally starts")
    void testConsumeSessionQuota() {
        UUID userId = UUID.randomUUID();
        InterviewUsage usage = InterviewUsage.builder()
                .userId(userId)
                .planType(PlanType.FREE)
                .sessionsReserved(1)
                .sessionsConsumed(0)
                .build();

        when(usageRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(usage));

        entitlementService.consumeSessionQuota(userId);

        assertEquals(0, usage.getSessionsReserved());
        assertEquals(1, usage.getSessionsConsumed());
        verify(usageRepository).save(usage);
    }

    @Test
    @DisplayName("Releases reservation when unstarted session is cancelled")
    void testReleaseReservation() {
        UUID userId = UUID.randomUUID();
        InterviewUsage usage = InterviewUsage.builder()
                .userId(userId)
                .planType(PlanType.FREE)
                .sessionsReserved(1)
                .sessionsConsumed(0)
                .build();

        when(usageRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(usage));

        entitlementService.releaseReservation(userId);

        assertEquals(0, usage.getSessionsReserved());
        assertEquals(0, usage.getSessionsConsumed());
        verify(usageRepository).save(usage);
    }

    @Test
    @DisplayName("Resets monthly consumption when Pro renewal date has passed")
    void testProRenewalReset() {
        UUID userId = UUID.randomUUID();
        InterviewUsage usage = InterviewUsage.builder()
                .userId(userId)
                .planType(PlanType.PRO)
                .sessionsReserved(0)
                .sessionsConsumed(48)
                .monthlyAllowance(50)
                .planRenewalDate(LocalDateTime.now().minusDays(1))
                .build();

        when(usageRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(usage));
        when(usageRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        InterviewUsage result = entitlementService.reserveSessionQuota(userId);

        // After reset, previous 48 consumed resets to 0, and 1 becomes reserved
        assertEquals(1, result.getSessionsReserved());
        assertEquals(0, result.getSessionsConsumed());
    }

    @Test
    @DisplayName("Allows unlimited interview sessions when entitlement enforcement is disabled")
    void testUnlimitedAccessWhenEnforcementDisabled() {
        UUID userId = UUID.randomUUID();
        EntitlementService disabledService = new EntitlementService(usageRepository, 3, 50, false);

        InterviewUsage usage = InterviewUsage.builder()
                .userId(userId)
                .planType(PlanType.FREE)
                .sessionsReserved(1)
                .sessionsConsumed(3)
                .build();

        when(usageRepository.findByUserId(userId)).thenReturn(Optional.of(usage));

        assertFalse(disabledService.isEnforced());
        assertDoesNotThrow(() -> disabledService.reserveSessionQuota(userId));
        assertDoesNotThrow(() -> disabledService.consumeSessionQuota(userId));
        assertDoesNotThrow(() -> disabledService.releaseReservation(userId));
    }
}

