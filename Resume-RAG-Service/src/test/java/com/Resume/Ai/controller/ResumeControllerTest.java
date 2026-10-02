package com.Resume.Ai.controller;

import com.Resume.Ai.dto.ResumeResponse;
import com.Resume.Ai.dto.ResumeSummaryResponse;
import com.Resume.Ai.dto.UpdateResumeRequest;
import com.Resume.Ai.enums.ResumeStatus;
import com.Resume.Ai.exception.GlobalExceptionHandler;
import com.Resume.Ai.exception.ResumeUnauthorizedAccessException;
import com.Resume.Ai.services.ResumeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ResumeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ResumeService resumeService;

    private UUID userId;
    private UUID resumeId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        resumeId = UUID.randomUUID();
        ResumeController controller = new ResumeController(resumeService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void uploadResume_ValidRequest_ReturnsCreated() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "dummy content".getBytes());
        ResumeResponse response = ResumeResponse.builder()
                .id(resumeId)
                .userId(userId)
                .resumeName("My Software Resume")
                .status(ResumeStatus.READY)
                .build();

        when(resumeService.uploadResume(any())).thenReturn(response);

        mockMvc.perform(multipart("/api/resumes/upload")
                        .file(file)
                        .param("resumeName", "My Software Resume")
                        .header("X-Authenticated-User-Id", userId.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(resumeId.toString()));
    }

    @Test
    void getMyResumes_ValidRequest_ReturnsList() throws Exception {
        ResumeSummaryResponse summary = ResumeSummaryResponse.builder()
                .id(resumeId)
                .resumeName("My Software Resume")
                .status(ResumeStatus.READY)
                .build();

        when(resumeService.getUserResumes(userId)).thenReturn(List.of(summary));

        mockMvc.perform(get("/api/resumes/me")
                        .header("X-Authenticated-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(resumeId.toString()));
    }

    @Test
    void getResume_Owned_ReturnsOk() throws Exception {
        ResumeResponse response = ResumeResponse.builder()
                .id(resumeId)
                .userId(userId)
                .resumeName("My Software Resume")
                .status(ResumeStatus.READY)
                .build();

        when(resumeService.getResume(resumeId, userId)).thenReturn(response);

        mockMvc.perform(get("/api/resumes/{resumeId}", resumeId)
                        .header("X-Authenticated-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(resumeId.toString()));
    }

    @Test
    void getResume_NotOwned_ReturnsForbidden() throws Exception {
        when(resumeService.getResume(resumeId, userId))
                .thenThrow(new ResumeUnauthorizedAccessException(resumeId, userId));

        mockMvc.perform(get("/api/resumes/{resumeId}", resumeId)
                        .header("X-Authenticated-User-Id", userId.toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void deleteResume_NotOwned_ReturnsForbidden() throws Exception {
        doThrow(new ResumeUnauthorizedAccessException(resumeId, userId))
                .when(resumeService).deleteResume(resumeId, userId);

        mockMvc.perform(delete("/api/resumes/{resumeId}", resumeId)
                        .header("X-Authenticated-User-Id", userId.toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
