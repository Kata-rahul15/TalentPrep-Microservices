package com.talentprep.interview.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;

class FollowUpGenerationServiceTest {

    private FollowUpGenerationService service;

    @BeforeEach
    void setUp() {
        service = new FollowUpGenerationService(mock(ChatClient.class), new ObjectMapper());
    }

    @Test
    void codingRoundAlwaysMovesOn() {
        var decision = service.decideFollowUp(
                RoundType.CODING, "Implement a queue", "Implemented using two stacks",
                null, CandidateContext.builder().targetRole("Java Developer").build(),
                List.of(), 0, 0, 900, DifficultyLevel.MEDIUM);

        assertEquals("MOVE_ON", decision.getDecision());
    }

    @Test
    void maximumFollowUpDepthMovesOn() {
        var decision = service.decideFollowUp(
                RoundType.TECHNICAL, "Explain transactions", "They provide atomicity",
                null, CandidateContext.builder().targetRole("Java Developer").build(),
                List.of(), 2, 1, 900, DifficultyLevel.MEDIUM);

        assertEquals("MOVE_ON", decision.getDecision());
    }

    @Test
    void maximumFollowUpCountMovesOn() {
        var decision = service.decideFollowUp(
                RoundType.TECHNICAL, "Explain transactions", "They provide atomicity",
                null, CandidateContext.builder().targetRole("Java Developer").build(),
                List.of(), 1, 2, 900, DifficultyLevel.MEDIUM);

        assertEquals("MOVE_ON", decision.getDecision());
    }


    @Test
    void correctConciseAnswerMovesOn() {
        ChatClient chatClient = mock(ChatClient.class, RETURNS_DEEP_STUBS);
        when(chatClient.prompt().user(anyString()).call().content()).thenReturn(
                "{\"decision\":\"MOVE_ON\",\"question\":\"\",\"reason\":\"Correct and sufficient\",\"topic\":\"Transactions\"}");
        var result = new FollowUpGenerationService(chatClient, new ObjectMapper()).decideFollowUp(
                RoundType.TECHNICAL, "What does ACID atomicity mean?",
                "All operations in the transaction succeed or none do.",
                "All-or-nothing transaction behavior.",
                CandidateContext.builder().targetRole("Java Developer").build(),
                List.of(), 0, 0, 900, DifficultyLevel.MEDIUM);
        assertEquals("MOVE_ON", result.getDecision());
    }

    @Test
    void essentialMissingConceptCanTriggerFocusedFollowUp() {
        ChatClient chatClient = mock(ChatClient.class, RETURNS_DEEP_STUBS);
        when(chatClient.prompt().user(anyString()).call().content()).thenReturn(
                "{\"decision\":\"ASK_FOLLOW_UP\",\"question\":\"How would you handle a rollback if the second write fails?\",\"reason\":\"Rollback behavior is essential here\",\"topic\":\"Rollback\",\"depth\":1}");
        var result = new FollowUpGenerationService(chatClient, new ObjectMapper()).decideFollowUp(
                RoundType.TECHNICAL, "Explain transaction atomicity.",
                "It means all operations are grouped together.",
                "All-or-nothing behavior, including rollback on failure.",
                CandidateContext.builder().targetRole("Java Developer").build(),
                List.of(), 0, 0, 900, DifficultyLevel.MEDIUM);
        assertEquals("ASK_FOLLOW_UP", result.getDecision());
        assertTrue(result.getQuestion().contains("rollback"));
    }

    @Test
    void skippedAnswerMovesOnWithoutCallingAi() {
        var decision = service.decideFollowUp(
                RoundType.TECHNICAL, "Explain transactions", "SKIPPED",
                null, CandidateContext.builder().targetRole("Java Developer").build(),
                List.of(), 0, 0, 900, DifficultyLevel.MEDIUM);

        assertEquals("MOVE_ON", decision.getDecision());
    }
}
