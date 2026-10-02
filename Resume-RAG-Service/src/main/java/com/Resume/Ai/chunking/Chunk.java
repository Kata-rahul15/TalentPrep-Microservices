package com.Resume.Ai.chunking;

public record Chunk(
        String section,
        int chunkIndex,
        String content
) {}
