package com.Resume.Ai.chunking;

import com.Resume.Ai.parser.ParsedResumeText;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Concrete component responsible for section-aware text chunking.
 */
@Component
public class ResumeChunker {

    private static final Logger log = LoggerFactory.getLogger(ResumeChunker.class);

    private static final int TARGET_MAX_CHUNK_CHARS = 1000;
    private static final int OVERLAP_CHARS = 100;

    public List<Chunk> chunk(ParsedResumeText parsedText) {
        List<Chunk> chunks = new ArrayList<>();
        if (parsedText == null) {
            return chunks;
        }

        Map<String, String> sections = parsedText.sections();
        int globalIndex = 0;

        if (sections != null && !sections.isEmpty()) {
            for (Map.Entry<String, String> entry : sections.entrySet()) {
                String sectionName = entry.getKey();
                String sectionText = entry.getValue();

                if (sectionText == null || sectionText.isBlank()) {
                    continue;
                }

                List<String> textSubChunks = splitText(sectionText, TARGET_MAX_CHUNK_CHARS, OVERLAP_CHARS);
                for (String subChunk : textSubChunks) {
                    chunks.add(new Chunk(sectionName.toUpperCase(), globalIndex++, subChunk.trim()));
                }
            }
        }

        if (chunks.isEmpty()) {
            String fallbackText = parsedText.normalizedText() != null && !parsedText.normalizedText().isBlank()
                    ? parsedText.normalizedText()
                    : parsedText.rawText();

            if (fallbackText != null && !fallbackText.isBlank()) {
                List<String> textSubChunks = splitText(fallbackText, TARGET_MAX_CHUNK_CHARS, OVERLAP_CHARS);
                for (String subChunk : textSubChunks) {
                    chunks.add(new Chunk("GENERAL", globalIndex++, subChunk.trim()));
                }
            }
        }

        log.debug("Chunking completed — produced {} chunks", chunks.size());
        return chunks;
    }

    private List<String> splitText(String text, int maxChars, int overlap) {
        List<String> result = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return result;
        }

        String cleaned = text.trim();
        if (cleaned.length() <= maxChars) {
            result.add(cleaned);
            return result;
        }

        int start = 0;
        while (start < cleaned.length()) {
            int end = Math.min(start + maxChars, cleaned.length());

            if (end < cleaned.length()) {
                int lastSpace = cleaned.lastIndexOf(' ', end);
                int lastNewline = cleaned.lastIndexOf('\n', end);
                int splitPoint = Math.max(lastSpace, lastNewline);
                if (splitPoint > start + (maxChars / 2)) {
                    end = splitPoint;
                }
            }

            String sub = cleaned.substring(start, end).trim();
            if (!sub.isBlank()) {
                result.add(sub);
            }

            if (end >= cleaned.length()) {
                break;
            }

            start = Math.max(end - overlap, start + 1);
        }

        return result;
    }
}
