package com.talentprep.interview.dto.response;

import com.talentprep.interview.entity.enums.RoundStatus;
import com.talentprep.interview.entity.enums.RoundType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewRoundResponse {
    private UUID id;
    private Integer roundOrder;
    private RoundType roundType;
    private RoundStatus status;
    private Integer targetQuestionCount;
    private Integer completedQuestionCount;
    private Integer roundScore;
}

