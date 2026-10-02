package com.Resume.Ai.controller;

import com.Resume.Ai.dto.ChunkSourceMetadata;
import com.Resume.Ai.dto.ResumeChatRequest;
import com.Resume.Ai.dto.ResumeChatResponse;
import com.Resume.Ai.exception.GlobalExceptionHandler;
import com.Resume.Ai.exception.ResumeNotFoundException;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import com.Resume.Ai.rag.ResumeRagService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ResumeRagControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ResumeRagService resumeRagService;

    private UUID userId;
    private UUID resumeId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        resumeId = UUID.randomUUID();
        ResumeRagController controller = new ResumeRagController(resumeRagService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void chatWithResume_ValidRequest_ReturnsOk() throws Exception {
        ResumeChatResponse response = ResumeChatResponse.builder()
                .answer("Java, Spring Boot")
                .sources(List.of(ChunkSourceMetadata.builder().section("SKILLS").chunkIndex(0).score(0.9).build()))
                .build();

        when(resumeRagService.answerQuestion(eq(userId), eq(resumeId), any(ResumeChatRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/resumes/{resumeId}/chat", resumeId)
                        .header("X-Authenticated-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"What technologies are present?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Java, Spring Boot"))
                .andExpect(jsonPath("$.sources[0].section").value("SKILLS"));
    }

    @Test
    void chatWithResume_BlankQuestion_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/resumes/{resumeId}/chat", resumeId)
                        .header("X-Authenticated-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void chatWithResume_Unauthorized_ReturnsForbidden() throws Exception {
        when(resumeRagService.answerQuestion(eq(userId), eq(resumeId), any(ResumeChatRequest.class)))
                .thenThrow(new ResumeUnauthorizedAccessException(resumeId, userId));

        mockMvc.perform(post("/api/resumes/{resumeId}/chat", resumeId)
                        .header("X-Authenticated-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"What technologies?\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void chatWithResume_NotFound_ReturnsNotFound() throws Exception {
        when(resumeRagService.answerQuestion(eq(userId), eq(resumeId), any(ResumeChatRequest.class)))
                .thenThrow(new ResumeNotFoundException(resumeId));

        mockMvc.perform(post("/api/resumes/{resumeId}/chat", resumeId)
                        .header("X-Authenticated-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"What technologies?\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
