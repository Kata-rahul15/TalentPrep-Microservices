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
public class ResumeResponse {

    private UUID id;
    private UUID userId;
    private String resumeName;
    private String originalFilename;
    private Long fileSize;
    private String mimeType;
    private ResumeStatus status;
    private Integer version;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
