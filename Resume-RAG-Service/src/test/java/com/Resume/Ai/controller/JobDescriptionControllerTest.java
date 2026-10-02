package com.Resume.Ai.controller;

import com.Resume.Ai.dto.CreateJobDescriptionRequest;
import com.Resume.Ai.dto.JobDescriptionResponse;
import com.Resume.Ai.exception.GlobalExceptionHandler;
import com.Resume.Ai.exception.JobDescriptionNotFoundException;
import com.Resume.Ai.jobdesc.service.JobDescriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class JobDescriptionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private JobDescriptionService jobDescriptionService;

    private UUID userId;
    private UUID jdId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        jdId = UUID.randomUUID();
        JobDescriptionController controller = new JobDescriptionController(jobDescriptionService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createJobDescription_ValidRequest_ReturnsCreated() throws Exception {
        JobDescriptionResponse response = JobDescriptionResponse.builder()
                .id(jdId)
                .userId(userId)
                .jobTitle("Java Dev")
                .companyName("Google")
                .description("Looking for Java Dev")
                .build();

        when(jobDescriptionService.createJobDescription(eq(userId), any(CreateJobDescriptionRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/job-descriptions")
                        .header("X-Authenticated-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Java Dev\",\"companyName\":\"Google\",\"description\":\"Looking for Java Dev\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(jdId.toString()))
                .andExpect(jsonPath("$.jobTitle").value("Java Dev"));
    }

    @Test
    void getJobDescription_NotFound_ReturnsNotFound() throws Exception {
        when(jobDescriptionService.getJobDescription(jdId))
                .thenThrow(new JobDescriptionNotFoundException(jdId));

        mockMvc.perform(get("/api/job-descriptions/{id}", jdId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
