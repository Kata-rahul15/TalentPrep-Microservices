package com.talentprep.interview;

import com.talentprep.interview.entity.InterviewUsage;
import com.talentprep.interview.entity.enums.PlanType;
import com.talentprep.interview.exception.QuotaExceededException;
import com.talentprep.interview.repository.InterviewUsageRepository;
import com.talentprep.interview.usage.EntitlementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ConcurrencyAndQuotaTest {

    @Test
    @DisplayName("Simultaneous concurrent session creation attempts cannot exceed free tier quota")
    void testConcurrentQuotaReservation() throws Exception {
        InterviewUsageRepository usageRepository = Mockito.mock(InterviewUsageRepository.class);
        EntitlementService entitlementService = new EntitlementService(usageRepository, 3, 50);

        UUID userId = UUID.randomUUID();

        // Simulate a shared usage entity with 2 existing consumed sessions
        InterviewUsage sharedUsage = InterviewUsage.builder()
                .userId(userId)
                .planType(PlanType.FREE)
                .sessionsReserved(0)
                .sessionsConsumed(2)
                .monthlyAllowance(3)
                .build();

        // In a real database, SELECT FOR UPDATE serializes access. We simulate this critical section:
        when(usageRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(sharedUsage));
        when(usageRepository.save(any(InterviewUsage.class))).thenAnswer(i -> i.getArgument(0));

        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger quotaExceededCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    synchronized (sharedUsage) { // Simulates SELECT FOR UPDATE lock
                        entitlementService.reserveSessionQuota(userId);
                    }
                    successCount.incrementAndGet();
                } catch (QuotaExceededException ex) {
                    quotaExceededCount.incrementAndGet();
                } catch (Exception e) {
                    fail("Unexpected exception: " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
        executor.shutdown();

        // Because allowed = 3 and consumed = 2, exactly 1 reservation must succeed and 4 must fail with QuotaExceededException
        assertEquals(1, successCount.get(), "Only 1 reservation should succeed");
        assertEquals(4, quotaExceededCount.get(), "4 concurrent requests should be blocked by quota limit");
    }
}

