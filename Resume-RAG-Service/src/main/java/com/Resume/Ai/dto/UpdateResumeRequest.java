package com.Resume.Ai.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateResumeRequest {

    private String resumeName;

    private Boolean active;
}