package com.Resume.Ai.chunking;

import com.Resume.Ai.parser.ParsedResumeText;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ResumeChunkerTest {

    private ResumeChunker chunker;

    @BeforeEach
    void setUp() {
        chunker = new ResumeChunker();
    }

    @Test
    void chunk_WithSections_GeneratesSectionChunks() {
        Map<String, String> sections = Map.of(
                "SUMMARY", "Experienced Java Developer with 5 years in Spring Boot.",
                "SKILLS", "Java, Spring Boot, PostgreSQL, Kafka, Redis",
                "PROJECTS", "Built microservices architecture for e-commerce."
        );
        ParsedResumeText parsed = new ParsedResumeText("raw", "norm", sections);

        List<Chunk> chunks = chunker.chunk(parsed);

        assertFalse(chunks.isEmpty());
        assertTrue(chunks.stream().anyMatch(c -> "SUMMARY".equals(c.section())));
        assertTrue(chunks.stream().anyMatch(c -> "SKILLS".equals(c.section())));
        assertTrue(chunks.stream().anyMatch(c -> "PROJECTS".equals(c.section())));
    }

    @Test
    void chunk_WithEmptySections_FallsBackToGeneral() {
        ParsedResumeText parsed = new ParsedResumeText("Raw resume content text", "Normalized content text", Map.of());

        List<Chunk> chunks = chunker.chunk(parsed);

        assertFalse(chunks.isEmpty());
        assertEquals("GENERAL", chunks.get(0).section());
        assertEquals("Normalized content text", chunks.get(0).content());
    }

    @Test
    void chunk_NullParsedText_ReturnsEmptyList() {
        List<Chunk> chunks = chunker.chunk(null);
        assertTrue(chunks.isEmpty());
    }
}
