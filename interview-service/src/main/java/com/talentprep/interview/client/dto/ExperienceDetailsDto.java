package com.talentprep.interview.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceDetailsDto {
    private String company;
    private String role;
    private String location;
    private String startDate;
    private String endDate;

    @Builder.Default
    private List<String> responsibilities = new ArrayList<>();

    @Builder.Default
    private List<String> achievements = new ArrayList<>();

    @Builder.Default
    private List<String> technologies = new ArrayList<>();
}

