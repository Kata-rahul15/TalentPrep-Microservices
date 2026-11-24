package com.talentprep.interview.coding.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlineCompilerRunRequest {
    private String compiler;
    private String code;
    private String input;
}
