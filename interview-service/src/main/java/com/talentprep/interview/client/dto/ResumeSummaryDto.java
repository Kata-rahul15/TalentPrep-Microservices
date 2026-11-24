package com.talentprep.interview.client.dto;

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
public class ResumeSummaryDto {
    private UUID id;
    private String resumeName;
    private String status;
    private LocalDateTime createdAt;
}

