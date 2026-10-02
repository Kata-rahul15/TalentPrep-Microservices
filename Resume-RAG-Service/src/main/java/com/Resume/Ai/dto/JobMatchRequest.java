package com.Resume.Ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobMatchRequest {

    @NotNull(message = "jobDescriptionId must not be null.")
    private UUID jobDescriptionId;
}
