package com.talentprep.interview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.InterviewAgent;
import com.talentprep.interview.agent.InterviewOrchestrator;
import com.talentprep.interview.agent.InterviewStrategy;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.prompt.*;
import com.talentprep.interview.agent.strategy.*;
import com.talentprep.interview.coding.IsolatedCodeExecutionService;
import com.talentprep.interview.coding.dto.CodeRunRequest;
import com.talentprep.interview.coding.dto.CodeRunResult;
import com.talentprep.interview.exception.AiEvaluationUnavailableException;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.context.dto.ProjectContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.ai.chat.client.ChatClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class InterviewOrchestratorAndStrategiesTest {

    private ObjectMapper objectMapper;
    private ChatClient chatClient;
    private InterviewOrchestrator orchestrator;
    private InterviewAgent interviewAgent;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        chatClient = Mockito.mock(ChatClient.class, Mockito.RETURNS_DEEP_STUBS);

        TechnicalInterviewStrategy tech = new TechnicalInterviewStrategy(chatClient, objectMapper, new TechnicalPromptBuilder());
        CodingInterviewStrategy coding = new CodingInterviewStrategy(chatClient, objectMapper, new CodingPromptBuilder(), new IsolatedCodeExecutionService(), Mockito.mock(com.talentprep.interview.coding.service.CodingProblemBankService.class));
        ProjectInterviewStrategy project = new ProjectInterviewStrategy(chatClient, objectMapper, new ProjectPromptBuilder());
        SystemDesignInterviewStrategy sd = new SystemDesignInterviewStrategy(chatClient, objectMapper, new SystemDesignPromptBuilder());
        BehavioralInterviewStrategy beh = new BehavioralInterviewStrategy(chatClient, objectMapper, new BehavioralPromptBuilder());

        List<InterviewStrategy> list = List.of(tech, coding, project, sd, beh);
        orchestrator = new InterviewOrchestrator(list);
        interviewAgent = new InterviewAgent(orchestrator);
    }

    @Test
    @DisplayName("Orchestrator resolves all 5 round strategies accurately")
    void testOrchestratorResolution() {
        assertNotNull(orchestrator.getStrategy(RoundType.TECHNICAL));
        assertNotNull(orchestrator.getStrategy(RoundType.CODING));
        assertNotNull(orchestrator.getStrategy(RoundType.PROJECT));
        assertNotNull(orchestrator.getStrategy(RoundType.SYSTEM_DESIGN));
        assertNotNull(orchestrator.getStrategy(RoundType.BEHAVIORAL));
    }

    @Test
    @DisplayName("Technical strategy produces valid fallback question when AI output is empty")
    void testTechnicalFallback() {
        CandidateContext context = CandidateContext.builder()
                .candidateName("John Doe")
                .targetRole("Java Developer")
                .experienceLevel("Mid Level")
                .skills(List.of("Java", "Spring Boot"))
                .build();

        InterviewStrategy strategy = orchestrator.getStrategy(RoundType.TECHNICAL);
        AgentQuestionResponse question = strategy.generateQuestion(context, DifficultyLevel.MEDIUM, List.of(), 1, 4);

        assertNotNull(question);
        assertNotNull(question.getQuestionText());
        assertTrue(question.getQuestionText().contains("Spring Boot") || question.getQuestionText().contains("thread-safety"));
    }

    @Test
    @DisplayName("Coding strategy generates starter boilerplate and algorithm question")
    void testCodingStrategyFallback() {
        CandidateContext context = CandidateContext.builder()
                .candidateName("Jane Doe")
                .targetRole("Backend Engineer")
                .build();

        InterviewStrategy strategy = orchestrator.getStrategy(RoundType.CODING);
        AgentQuestionResponse question = strategy.generateQuestion(context, DifficultyLevel.EASY, List.of(), 1, 2);

        assertNotNull(question);
        assertNotNull(question.getCodingBoilerplate());
        assertTrue(question.getCodingBoilerplate().contains("Solution"));
    }

    @Test
    @DisplayName("Project strategy references candidate's actual projects")
    void testProjectPromptBuilding() {
        ProjectPromptBuilder builder = new ProjectPromptBuilder();
        CandidateContext context = CandidateContext.builder()
                .candidateName("Alice")
                .targetRole("Full Stack Dev")
                .projects(List.of(ProjectContext.builder()
                        .name("E-Commerce Portal")
                        .description("Microservices store")
                        .technologies(List.of("Java", "Kafka", "PostgreSQL"))
                        .build()))
                .build();

        String prompt = builder.buildQuestionPrompt(context, DifficultyLevel.HARD, List.of(), 1, 3);
        assertTrue(prompt.contains("E-Commerce Portal"));
        assertTrue(prompt.contains("Kafka"));
    }

    @Test
    @DisplayName("Agent generates follow-up only when AI evaluation explicitly requests it")
    void testFollowUpGeneration() {
        CandidateContext context = CandidateContext.builder()
                .candidateName("Bob")
                .targetRole("Java Developer")
                .build();

        List<ConversationTurn> history = List.of(
                ConversationTurn.builder()
                        .order(1)
                        .questionText("How do you configure caching in Spring Boot?")
                        .candidateAnswer("I configured RedisCacheManager with customized TTL per cache name and serialization using Jackson2JsonRedisSerializer.")
                        .isFollowUp(false)
                        .triggersFollowUp(true)
                        .followUpReason("Probe the Redis TTL and serialization trade-offs.")
                        .build()
        );

        AgentQuestionResponse q = interviewAgent.askNextQuestion(RoundType.TECHNICAL, context, DifficultyLevel.MEDIUM, history, 2, 4);
        assertNotNull(q);
        assertTrue(Boolean.TRUE.equals(q.getIsFollowUp()));
    }
    @Test
    @DisplayName("Does not generate follow-up from answer length alone")
    void testNoFollowUpWithoutEvaluationSignal() {
        CandidateContext context = CandidateContext.builder().candidateName("Bob").targetRole("Java Developer").build();
        List<ConversationTurn> history = List.of(ConversationTurn.builder()
                .order(1)
                .questionText("Explain Redis caching.")
                .candidateAnswer("This is a detailed answer with well over fifty characters that should not trigger by itself.")
                .isFollowUp(false)
                .triggersFollowUp(false)
                .build());

        AgentQuestionResponse question = interviewAgent.askNextQuestion(
                RoundType.TECHNICAL, context, DifficultyLevel.HARD, history, 2, 4);
        assertNotNull(question);
        assertFalse(Boolean.TRUE.equals(question.getIsFollowUp()));
        assertEquals(DifficultyLevel.HARD.name(), question.getDifficulty());
    }

    @Test
    @DisplayName("Does not invent a score when the AI evaluation response is empty")
    void testEvaluationFailsClosed() {
        CandidateContext context = CandidateContext.builder().candidateName("Bob").targetRole("Java Developer").build();
        InterviewStrategy strategy = orchestrator.getStrategy(RoundType.TECHNICAL);
        assertThrows(AiEvaluationUnavailableException.class, () -> strategy.evaluateAnswer(
                "Explain dependency injection", "Spring injects dependencies through the container.", context, List.of()));
    }

    @Test
    @DisplayName("Code runner reports unavailable instead of simulating successful execution")
    void testCodeExecutionIsExplicitlyDisabled() {
        IsolatedCodeExecutionService executor = new IsolatedCodeExecutionService();
        CodeRunResult result = executor.execute(CodeRunRequest.builder()
                .language("java")
                .code("class Solution { int solve() { return 1; } }")
                .testCases(List.of(java.util.Map.of("input", "", "expected", "1")))
                .build());
        assertFalse(result.isCompiled());
        assertEquals(0, result.getPassedCount());
        assertTrue(result.getCompilationOutput().contains("not been configured"));
    }

}

