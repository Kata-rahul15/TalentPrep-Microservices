package com.Resume.Ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChunkSourceMetadata {
    private String section;
    private Integer chunkIndex;
    private Double score;
}
