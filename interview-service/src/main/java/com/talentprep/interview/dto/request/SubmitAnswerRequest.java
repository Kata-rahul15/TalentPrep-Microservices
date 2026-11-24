package com.talentprep.interview.dto.request;

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
public class SubmitAnswerRequest {

    @NotNull(message = "questionId is required")
    private UUID questionId;

    private String clientRequestId;
    private String answerText;
    private Integer timeTakenSeconds;
}

