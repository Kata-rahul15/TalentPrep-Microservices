package com.talentprep.interview.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationTurn {
    private UUID questionId;
    private Integer order;
    private String questionText;
    private String questionCategory;
    private String difficulty;
    private Boolean isFollowUp;
    private String candidateAnswer;
    private Integer score;
    private String feedback;
    private Boolean triggersFollowUp;
    private String followUpReason;
}

