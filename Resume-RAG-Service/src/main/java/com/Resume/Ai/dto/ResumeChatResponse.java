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
public class ResumeChatResponse {

    private String answer;
    private List<ChunkSourceMetadata> sources;
}
