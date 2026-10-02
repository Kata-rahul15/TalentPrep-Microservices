package com.Resume.Ai.Entity;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Structured representation of one resume project.
 *
 * Stored as JSON inside ResumeSection.projects.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDetails {

    private String name;

    private String description;

    @Builder.Default
    private List<String> technologies = new ArrayList<>();

    @Builder.Default
    private List<String> highlights = new ArrayList<>();
}
