package com.Resume.Ai.dto;

import com.Resume.Ai.enums.SkillImportance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingSkill {

    private String skill;
    private SkillImportance importance;
    private String suggestion;
}
