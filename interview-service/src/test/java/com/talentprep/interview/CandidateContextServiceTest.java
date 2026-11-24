package com.talentprep.interview;

import com.talentprep.interview.client.ResumeServiceClient;
import com.talentprep.interview.client.dto.*;
import com.talentprep.interview.context.CandidateContextService;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.exception.ResumeIntegrationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class CandidateContextServiceTest {

    private ResumeServiceClient resumeServiceClient;
    private CandidateContextService candidateContextService;

    @BeforeEach
    void setUp() {
        resumeServiceClient = Mockito.mock(ResumeServiceClient.class);
        candidateContextService = new CandidateContextService(resumeServiceClient);
    }

    @Test
    @DisplayName("Successfully maps verified resume profile to candidate context")
    void testBuildContextSuccess() {
        UUID userId = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();

        ResumeProfileDto profile = ResumeProfileDto.builder()
                .candidateId(userId)
                .resumeId(resumeId)
                .name("Alex Smith")
                .summary("Backend engineer with 4 years experience in Java and Spring Boot.")
                .skills(List.of("Java", "Spring Boot", "PostgreSQL", "Docker"))
                .targetRoles(List.of("Backend Developer", "Java Engineer"))
                .contact(ContactDetailsDto.builder().email("alex@example.com").build())
                .projects(List.of(ProjectDetailsDto.builder()
                        .name("TalentPrep")
                        .description("AI interview prep")
                        .technologies(List.of("Java", "PostgreSQL"))
                        .build()))
                .experience(List.of(
                        ExperienceDetailsDto.builder().company("Acme").role("SE").build(),
                        ExperienceDetailsDto.builder().company("Beta").role("Senior SE").build()
                ))
                .certifications(List.of("AWS Certified Developer"))
                .build();

        when(resumeServiceClient.getResumeProfile(resumeId, userId)).thenReturn(profile);

        CandidateContext context = candidateContextService.buildContext(resumeId, userId);

        assertNotNull(context);
        assertEquals(userId, context.getUserId());
        assertEquals(resumeId, context.getResumeId());
        assertEquals("Alex Smith", context.getCandidateName());
        assertEquals("Backend Developer", context.getTargetRole());
        assertEquals(4, context.getSkills().size());
        assertEquals(1, context.getProjects().size());
        assertEquals("TalentPrep", context.getProjects().get(0).getName());
        assertEquals("Mid Level", context.getExperienceLevel());
    }

    @Test
    @DisplayName("Fails when candidate ID in profile does not match authenticated user ID")
    void testOwnershipMismatchThrowsException() {
        UUID authenticatedUser = UUID.randomUUID();
        UUID attackerUser = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();

        ResumeProfileDto victimProfile = ResumeProfileDto.builder()
                .candidateId(victimProfileCandidateId())
                .resumeId(resumeId)
                .name("Victim")
                .build();

        when(resumeServiceClient.getResumeProfile(resumeId, attackerUser)).thenReturn(victimProfile);

        assertThrows(ResumeIntegrationException.class, () ->
                candidateContextService.buildContext(resumeId, attackerUser));
    }

    @Test
    @DisplayName("Falls back gracefully without fabricating details when user has no active resume")
    void testBuildContextWithoutActiveResume() {
        UUID userId = UUID.randomUUID();
        when(resumeServiceClient.getActiveResumeProfile(userId)).thenReturn(null);

        CandidateContext context = candidateContextService.buildContext(null, userId);

        assertNotNull(context);
        assertFalse(context.isResumeAvailable());
        assertNull(context.getResumeId());
        assertTrue(context.getSkills().isEmpty());
        assertTrue(context.getProjects().isEmpty());
        assertTrue(context.getExperience().isEmpty());
    }

    private UUID victimProfileCandidateId() {
        return UUID.randomUUID();
    }
}

