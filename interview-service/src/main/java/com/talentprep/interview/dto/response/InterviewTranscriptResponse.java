package com.talentprep.interview.dto.response;

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
public class InterviewTranscriptResponse {
    private UUID sessionId;
    private String candidateName;
    private String targetRole;
    private String status;

    @Builder.Default
    private List<TranscriptItem> items = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TranscriptItem {
        private Integer roundOrder;
        private String roundType;
        private Integer questionOrder;
        private String questionText;
        private String answerText;
        private Integer score;
        private String feedback;
        private String idealAnswer;
    }
}

