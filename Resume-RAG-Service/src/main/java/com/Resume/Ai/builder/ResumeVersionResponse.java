package com.Resume.Ai.builder;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResumeVersionResponse {
    private UUID id;
    private UUID resumeId;
    private Integer versionNumber;
    private String label;
    private LocalDateTime createdAt;
}
