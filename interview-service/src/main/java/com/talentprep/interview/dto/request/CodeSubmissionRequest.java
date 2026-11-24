package com.talentprep.interview.dto.request;

import jakarta.validation.constraints.NotBlank;
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
public class CodeSubmissionRequest {

    @NotNull(message = "questionId is required")
    private UUID questionId;

    @NotBlank(message = "code is required")
    private String code;

    private String language;
}

