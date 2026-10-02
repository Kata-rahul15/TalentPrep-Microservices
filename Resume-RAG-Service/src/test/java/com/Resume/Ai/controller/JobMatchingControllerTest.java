package com.Resume.Ai.controller;

import com.Resume.Ai.dto.JobMatchRequest;
import com.Resume.Ai.dto.JobMatchResponse;
import com.Resume.Ai.enums.JobMatchStatus;
import com.Resume.Ai.exception.GlobalExceptionHandler;
import com.Resume.Ai.exception.JobDescriptionNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import com.Resume.Ai.matching.JobMatchingService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class JobMatchingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private JobMatchingService jobMatchingService;

    private UUID userId;
    private UUID resumeId;
    private UUID jdId;
    private UUID matchId;

    @BeforeEach
    void setUp() {

        userId = UUID.randomUUID();
        resumeId = UUID.randomUUID();
        jdId = UUID.randomUUID();
        matchId = UUID.randomUUID();

        JobMatchingController controller =
                new JobMatchingController(jobMatchingService);

        mockMvc =
                MockMvcBuilders
                        .standaloneSetup(controller)
                        .setControllerAdvice(
                                new GlobalExceptionHandler()
                        )
                        .build();
    }

    @Test
    void startMatch_ReturnsAcceptedAndQueuedStatus()
            throws Exception {

        JobMatchResponse response =
                JobMatchResponse.builder()
                        .matchId(matchId)
                        .resumeId(resumeId)
                        .jobDescriptionId(jdId)
                        .status(JobMatchStatus.QUEUED)
                        .matchedSkills(List.of())
                        .missingSkills(List.of())
                        .missingKeywords(List.of())
                        .recommendations(List.of())
                        .evidence(List.of())
                        .build();

        when(
                jobMatchingService.startMatch(
                        eq(userId),
                        eq(resumeId),
                        any(JobMatchRequest.class)
                )
        ).thenReturn(response);

        mockMvc.perform(
                        post(
                                "/api/resumes/{resumeId}/match",
                                resumeId
                        )
                                .header(
                                        "X-Authenticated-User-Id",
                                        userId.toString()
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        String.format(
                                                "{\"jobDescriptionId\":\"%s\"}",
                                                jdId
                                        )
                                )
                )
                .andExpect(status().isAccepted())
                .andExpect(
                        jsonPath("$.matchId")
                                .value(matchId.toString())
                )
                .andExpect(
                        jsonPath("$.status")
                                .value("QUEUED")
                );
    }

    @Test
    void getMatchStatus_ReturnsCurrentStatus()
            throws Exception {

        JobMatchResponse response =
                JobMatchResponse.builder()
                        .matchId(matchId)
                        .resumeId(resumeId)
                        .jobDescriptionId(jdId)
                        .status(JobMatchStatus.EVALUATING_MATCH)
                        .matchedSkills(List.of())
                        .missingSkills(List.of())
                        .missingKeywords(List.of())
                        .recommendations(List.of())
                        .evidence(List.of())
                        .build();

        when(
                jobMatchingService.getMatchStatus(
                        eq(userId),
                        eq(resumeId),
                        eq(matchId)
                )
        ).thenReturn(response);

        mockMvc.perform(
                        get(
                                "/api/resumes/{resumeId}/match/{matchId}",
                                resumeId,
                                matchId
                        )
                                .header(
                                        "X-Authenticated-User-Id",
                                        userId.toString()
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.status")
                                .value("EVALUATING_MATCH")
                );
    }

    @Test
    void startMatch_Unauthorized_ReturnsForbidden()
            throws Exception {

        when(
                jobMatchingService.startMatch(
                        eq(userId),
                        eq(resumeId),
                        any(JobMatchRequest.class)
                )
        ).thenThrow(
                new ResumeUnauthorizedAccessException(
                        resumeId,
                        userId
                )
        );

        mockMvc.perform(
                        post(
                                "/api/resumes/{resumeId}/match",
                                resumeId
                        )
                                .header(
                                        "X-Authenticated-User-Id",
                                        userId.toString()
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        String.format(
                                                "{\"jobDescriptionId\":\"%s\"}",
                                                jdId
                                        )
                                )
                )
                .andExpect(status().isForbidden())
                .andExpect(
                        jsonPath("$.status")
                                .value(403)
                );
    }

    @Test
    void startMatch_JdNotFound_ReturnsNotFound()
            throws Exception {

        when(
                jobMatchingService.startMatch(
                        eq(userId),
                        eq(resumeId),
                        any(JobMatchRequest.class)
                )
        ).thenThrow(
                new JobDescriptionNotFoundException(jdId)
        );

        mockMvc.perform(
                        post(
                                "/api/resumes/{resumeId}/match",
                                resumeId
                        )
                                .header(
                                        "X-Authenticated-User-Id",
                                        userId.toString()
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        String.format(
                                                "{\"jobDescriptionId\":\"%s\"}",
                                                jdId
                                        )
                                )
                )
                .andExpect(status().isNotFound())
                .andExpect(
                        jsonPath("$.status")
                                .value(404)
                );
    }
}
