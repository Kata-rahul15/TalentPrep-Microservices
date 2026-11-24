package com.talentprep.interview.coding.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OnlineCompilerRunResponse {
    private String output;
    private String error;
    private String status;
    private Integer exit_code;
    private String signal;
    private Boolean truncated;
    private String time;
    private String total;
    private String memory;
}
