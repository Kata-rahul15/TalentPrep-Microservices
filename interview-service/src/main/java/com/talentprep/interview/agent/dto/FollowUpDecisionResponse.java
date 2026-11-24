package com.talentprep.interview.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpDecisionResponse {
    /**
     * Decision: ASK_FOLLOW_UP or MOVE_ON (legacy CLARIFY is normalized)
     */
    private String decision;

    /**
     * Follow-up or clarification question text if decision != MOVE_ON
     */
    private String question;

    /**
     * Rationale behind the follow-up decision
     */
    private String reason;

    /**
     * Specific technical topic or competency probed
     */
    private String topic;

    /**
     * Calculated or expected depth level
     */
    private Integer depth;

    /**
     * Estimated time in seconds candidate needs to answer
     */
    private Integer estimatedAnswerSeconds;
}

