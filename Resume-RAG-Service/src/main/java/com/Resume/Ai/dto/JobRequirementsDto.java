package com.Resume.Ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRequirementsDto {

    @Builder.Default
    private List<String> requiredSkills = List.of();

    @Builder.Default
    private List<String> preferredSkills = List.of();

    @Builder.Default
    private List<String> responsibilities = List.of();

    private Integer minYearsExperience;

    private String education;
}