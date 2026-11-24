package com.talentprep.interview.dto.response;

import com.talentprep.interview.entity.enums.QuestionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewQuestionResponse {
    private UUID questionId;
    private UUID roundId;
    private UUID sessionId;
    private Integer roundOrder;
    private String roundType;
    private Integer questionOrder;
    private Integer targetQuestionCount;
    private String questionText;
    private String questionCategory;
    private String difficulty;
    private Boolean isFollowUp;
    private UUID parentQuestionId;
    private Integer depth;
    private String topic;
    private QuestionStatus questionStatus;
    private String codingBoilerplate;
    private Map<String, String> codingStarterTemplates;

    @Builder.Default
    private List<Map<String, Object>> codingTestCases = new ArrayList<>();

    private LocalDateTime createdAt;
}
