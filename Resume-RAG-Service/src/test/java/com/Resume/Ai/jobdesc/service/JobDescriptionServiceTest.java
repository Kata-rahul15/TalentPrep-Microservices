package com.Resume.Ai.jobdesc.service;

import com.Resume.Ai.Entity.JobDescription;
import com.Resume.Ai.Repositories.JobDescriptionRepository;
import com.Resume.Ai.dto.CreateJobDescriptionRequest;
import com.Resume.Ai.dto.JobDescriptionResponse;
import com.Resume.Ai.exception.JobDescriptionNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobDescriptionServiceTest {

    @Mock private JobDescriptionRepository repository;

    private JobDescriptionService service;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID JOB_ID  = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new JobDescriptionService(repository);
    }

    @Test
    @DisplayName("Create Job Description — normalizes text and persists record")
    void createJobDescription_validRequest_returnsResponse() {
        CreateJobDescriptionRequest request = CreateJobDescriptionRequest.builder()
                .companyName("Acme Corp")
                .title("Software Engineer")
                .description("  Require  Java  • Spring   ")
                .build();

        JobDescription saved = JobDescription.builder()
                .id(JOB_ID)
                .userId(USER_ID)
                .companyName("Acme Corp")
                .jobTitle("Software Engineer")
                .description("Require Java - Spring")
                .createdAt(LocalDateTime.now())
                .build();

        when(repository.save(any())).thenReturn(saved);

        JobDescriptionResponse response = service.createJobDescription(USER_ID, request);

        assertThat(response).isNotNull();
        assertThat(response.getJobTitle()).isEqualTo("Software Engineer");
        verify(repository).save(any());
    }

    @Test
    @DisplayName("getJobDescription — unknown ID throws JobDescriptionNotFoundException")
    void getJobDescription_notFound_throwsException() {
        when(repository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getJobDescription(JOB_ID))
                .isInstanceOf(JobDescriptionNotFoundException.class);
    }
}
