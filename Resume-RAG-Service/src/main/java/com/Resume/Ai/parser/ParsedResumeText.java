package com.Resume.Ai.parser;

import java.util.Map;


public record ParsedResumeText(
        String rawText,
        String normalizedText,
        Map<String, String> sections
) {}
