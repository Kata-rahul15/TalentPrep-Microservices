package com.talentprep.interview.dto.response;

import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.InterviewMode;
import com.talentprep.interview.entity.enums.InterviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSessionResponse {
    private UUID id;
    private UUID userId;
    private UUID resumeId;
    private InterviewStatus status;
    private DifficultyLevel difficulty;
    private InterviewMode mode;
    private String targetRole;
    private Integer durationMinutes;
    private Integer currentRoundIndex;
    private Integer totalRounds;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime pausedAt;
    private Long totalPausedSeconds;
    private Long remainingSeconds;
    private LocalDateTime endsAt;
    private LocalDateTime createdAt;

    @Builder.Default
    private List<InterviewRoundResponse> rounds = new ArrayList<>();
}

