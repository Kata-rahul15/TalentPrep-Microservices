package com.Resume.Ai.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtsSuggestion {
    private String section;
    private String priority;
    private String message;
}
