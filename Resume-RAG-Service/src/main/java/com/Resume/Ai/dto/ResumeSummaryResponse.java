package com.Resume.Ai.dto;

import com.Resume.Ai.enums.ResumeStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeSummaryResponse {

    private UUID id;

    private String resumeName;

    private ResumeStatus status;

    private LocalDateTime createdAt;
}