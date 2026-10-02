package com.Resume.Ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDescriptionResponse {

    private UUID id;
    private UUID userId;
    private String companyName;
    private String jobTitle;
    private String description;
    private LocalDateTime createdAt;
}
