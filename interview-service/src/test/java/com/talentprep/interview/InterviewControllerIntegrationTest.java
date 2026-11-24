package com.talentprep.interview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.controller.InterviewController;
import com.talentprep.interview.dto.request.CreateInterviewRequest;
import com.talentprep.interview.dto.request.InterviewRespondRequest;
import com.talentprep.interview.dto.response.CandidateSetupDetailsResponse;
import com.talentprep.interview.dto.response.InterviewRespondResponse;
import com.talentprep.interview.dto.response.InterviewSessionResponse;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.InterviewMode;
import com.talentprep.interview.entity.enums.InterviewStatus;
import com.talentprep.interview.entity.enums.RoundType;
import com.talentprep.interview.exception.GlobalExceptionHandler;
import com.talentprep.interview.identity.GatewayIdentityHelper;
import com.talentprep.interview.session.InterviewSessionService;
import com.talentprep.interview.session.InterviewSessionQueryService;
import com.talentprep.interview.session.InterviewSessionLifecycleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class InterviewControllerIntegrationTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private InterviewSessionService sessionService;

    @Mock
    private InterviewSessionQueryService queryService;

    @Mock
    private InterviewSessionLifecycleService lifecycleService;

    @Mock
    private GatewayIdentityHelper identityHelper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        InterviewController controller = new InterviewController(sessionService, queryService, lifecycleService, identityHelper);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/interviews/setup returns pre-populated candidate info")
    void testGetSetupDetails() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();

        when(identityHelper.requireCurrentUserId()).thenReturn(userId);

        CandidateSetupDetailsResponse response = CandidateSetupDetailsResponse.builder()
                .resumeId(resumeId)
                .candidateName("Alice Johnson")
                .targetRole("Spring Boot Developer")
                .availableTargetRoles(List.of("Spring Boot Developer", "Java Engineer"))
                .experienceLevel("Senior Level")
                .skills(List.of("Java", "Spring Boot", "Kafka", "PostgreSQL"))
                .availableSessionsRemaining(3)
                .planType("FREE")
                .build();

        when(sessionService.getSetupDetails(eq(resumeId), eq(userId))).thenReturn(response);

        mockMvc.perform(get("/api/interviews/setup")
                        .param("resumeId", resumeId.toString())
                        .header("X-Authenticated-User-Id", userId.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateName").value("Alice Johnson"))
                .andExpect(jsonPath("$.targetRole").value("Spring Boot Developer"))
                .andExpect(jsonPath("$.availableSessionsRemaining").value(3));
    }

    @Test
    @DisplayName("POST /api/interviews creates a new session successfully")
    void testCreateSession() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        when(identityHelper.requireCurrentUserId()).thenReturn(userId);

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .rounds(List.of(RoundType.TECHNICAL))
                .build();

        InterviewSessionResponse response = InterviewSessionResponse.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.CREATED)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .targetRole("Software Engineer")
                .build();

        when(sessionService.createSession(any(CreateInterviewRequest.class), eq(userId))).thenReturn(response);

        mockMvc.perform(post("/api/interviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-Authenticated-User-Id", userId.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(sessionId.toString()))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    @DisplayName("POST /api/interviews/{id}/respond accepts text response and returns AI response")
    void testRespond() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        when(identityHelper.requireCurrentUserId()).thenReturn(userId);

        InterviewRespondRequest request = InterviewRespondRequest.builder()
                .message("Explain the difference between HashMap and ConcurrentHashMap.")
                .build();

        InterviewRespondResponse response = InterviewRespondResponse.builder()
                .sessionId(sessionId)
                .response("ConcurrentHashMap uses synchronized bucket nodes to allow concurrent reads and writes.")
                .message("ConcurrentHashMap uses synchronized bucket nodes to allow concurrent reads and writes.")
                .turnSequence(1)
                .completed(false)
                .build();

        when(sessionService.respond(eq(sessionId), any(InterviewRespondRequest.class), eq(userId))).thenReturn(response);

        mockMvc.perform(post("/api/interviews/" + sessionId + "/respond")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-Authenticated-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId.toString()))
                .andExpect(jsonPath("$.response").value("ConcurrentHashMap uses synchronized bucket nodes to allow concurrent reads and writes."))
                .andExpect(jsonPath("$.completed").value(false));
    }
}
