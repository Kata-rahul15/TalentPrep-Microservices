package com.Resume.Ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeEvidence {

    private String requirement;
    private String section;
    private String snippet;
    private Double score;
}
