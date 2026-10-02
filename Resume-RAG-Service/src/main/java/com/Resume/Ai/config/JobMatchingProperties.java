package com.Resume.Ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "resume.matching")
@Getter
@Setter
public class JobMatchingProperties {

    private double requiredSkillsWeight = 0.60;
    private double preferredSkillsWeight = 0.20;
    private double responsibilitiesWeight = 0.20;
}
