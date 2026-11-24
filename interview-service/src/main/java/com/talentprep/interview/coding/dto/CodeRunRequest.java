package com.talentprep.interview.coding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeRunRequest {
    private String language;
    private String code;
    private String customInput;

    @Builder.Default
    private List<Map<String, Object>> testCases = new ArrayList<>();
}
