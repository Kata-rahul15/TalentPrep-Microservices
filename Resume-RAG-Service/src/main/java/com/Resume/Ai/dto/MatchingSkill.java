package com.Resume.Ai.dto;

import com.Resume.Ai.enums.MatchType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingSkill {

    private String skill;
    private MatchType matchType;
    private String evidence;
}
