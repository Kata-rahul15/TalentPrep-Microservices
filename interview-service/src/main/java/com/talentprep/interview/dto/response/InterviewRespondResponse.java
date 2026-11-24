package com.talentprep.interview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewRespondResponse {
    private UUID sessionId;
    private String response;
    private String message;
    private Integer turnSequence;
    private boolean completed;
}
