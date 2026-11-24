package com.talentprep.interview.dto.request;

import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.InterviewMode;
import com.talentprep.interview.entity.enums.RoundType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInterviewRequest {

    /** Optional: if null, uses user's active resume */
    private UUID resumeId;

    @NotNull(message = "Difficulty level is required")
    private DifficultyLevel difficulty;

    @NotNull(message = "Interview mode is required")
    private InterviewMode mode;

    @NotEmpty(message = "At least one interview round must be selected")
    @Builder.Default
    private List<RoundType> rounds = new ArrayList<>();

    private String targetRole;
    private String targetJobDescription;
    private Integer durationMinutes;
    private String idempotencyKey;
}

