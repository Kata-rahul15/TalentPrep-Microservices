package com.Resume.Ai.parser;

import com.Resume.Ai.exception.ResumeParsingException;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.pdf.PDFParserConfig;
import org.apache.tika.sax.BodyContentHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Apache Tika document extraction and deterministic text cleanup.
 *
 * IMPORTANT: this class does NOT semantically extract the resume anymore.
 * Tika extracts text; this parser only normalizes obvious document artifacts
 * and exposes section boundaries for RAG chunk metadata. Semantic resume
 * extraction is performed once by ResumeAiAnalyzer.
 */
@Component
public class ResumeParser {

    private static final Logger log = LoggerFactory.getLogger(ResumeParser.class);

    private static final int UNLIMITED_CONTENT_LENGTH = -1;
    private static final Pattern EXCESSIVE_BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Pattern INLINE_WHITESPACE = Pattern.compile("[ \\t]+");
    private static final Pattern TRAILING_WHITESPACE = Pattern.compile("[ \\t]+$", Pattern.MULTILINE);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("(?i)(mailto:)?[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}");
    private static final Pattern CONTACT_URL_PATTERN = Pattern.compile("(?i)(linkedin\\.com|github\\.com|gitlab\\.com|behance\\.net|dribbble\\.com)");

    private static final Map<String, String> HEADER_VARIANTS = new LinkedHashMap<>();

    static {
        register("SUMMARY", "SUMMARY");
        register("PROFESSIONAL SUMMARY", "SUMMARY");
        register("PROFILE", "SUMMARY");
        register("OBJECTIVE", "SUMMARY");
        register("CAREER OBJECTIVE", "SUMMARY");
        register("ABOUT ME", "SUMMARY");

        register("EDUCATION", "EDUCATION");
        register("ACADEMIC QUALIFICATIONS", "EDUCATION");
        register("EDUCATIONAL QUALIFICATIONS", "EDUCATION");
        register("ACADEMIC BACKGROUND", "EDUCATION");
        register("QUALIFICATIONS", "EDUCATION");

        register("EXPERIENCE", "EXPERIENCE");
        register("WORK EXPERIENCE", "EXPERIENCE");
        register("PROFESSIONAL EXPERIENCE", "EXPERIENCE");
        register("EMPLOYMENT HISTORY", "EXPERIENCE");
        register("INTERNSHIP", "EXPERIENCE");
        register("INTERNSHIPS", "EXPERIENCE");
        register("VIRTUAL EXPERIENCE", "EXPERIENCE");
        register("WORK HISTORY", "EXPERIENCE");
        register("EXPERIENCES", "EXPERIENCE");

        register("PROJECTS", "PROJECTS");
        register("PERSONAL PROJECTS", "PROJECTS");
        register("ACADEMIC PROJECTS", "PROJECTS");
        register("KEY PROJECTS", "PROJECTS");
        register("PROJECT EXPERIENCE", "PROJECTS");
        register("SELECTED PROJECTS", "PROJECTS");

        register("SKILLS", "SKILLS");
        register("TECHNICAL SKILLS", "SKILLS");
        register("TECHNOLOGIES", "SKILLS");
        register("TECHNICAL SKILLS & TOOLS", "SKILLS");
        register("TECHNICAL SKILLS AND TOOLS", "SKILLS");
        register("CORE COMPETENCIES", "SKILLS");
        register("KEY SKILLS", "SKILLS");
        register("SKILLS AND TOOLS", "SKILLS");
        register("TECHNICAL EXPERTISE", "SKILLS");

        register("CERTIFICATIONS", "CERTIFICATIONS");
        register("CERTIFICATES", "CERTIFICATIONS");
        register("COURSES & CERTIFICATIONS", "CERTIFICATIONS");
        register("COURSES AND CERTIFICATIONS", "CERTIFICATIONS");
        register("LICENSES", "CERTIFICATIONS");
        register("CERTIFICATIONS AND LICENSES", "CERTIFICATIONS");

        register("ACHIEVEMENTS", "ACHIEVEMENTS");
        register("AWARDS", "ACHIEVEMENTS");
        register("AWARDS & ACHIEVEMENTS", "ACHIEVEMENTS");
        register("AWARDS AND ACHIEVEMENTS", "ACHIEVEMENTS");
        register("ACCOMPLISHMENTS", "ACHIEVEMENTS");
        register("HONORS", "ACHIEVEMENTS");

        register("LANGUAGES", "LANGUAGES");
        register("LANGUAGE PROFICIENCY", "LANGUAGES");
        register("LANGUAGES KNOWN", "LANGUAGES");

        register("CONTACT", "CONTACT");
        register("CONTACT INFORMATION", "CONTACT");
        register("PERSONAL INFORMATION", "CONTACT");
        register("PERSONAL DETAILS", "CONTACT");
    }

    private final AutoDetectParser tikaParser = new AutoDetectParser();

    public ParsedResumeText parse(Resource resource, String mimeType) {
        log.info("Parsing resume resource: {}", resource.getDescription());

        String rawText = extractRawText(resource, mimeType);
        if (rawText.isBlank()) {
            throw new ResumeParsingException(
                    "The document is empty or contains no extractable text. It may be a scanned image or password-protected PDF."
            );
        }

        String normalizedText = normalize(rawText);
        normalizedText = removeDuplicateBlocks(normalizedText);

        Map<String, String> sections = extractSections(normalizedText);

        log.info("Parsing complete — rawChars={}, normalizedChars={}, sections={}",
                rawText.length(), normalizedText.length(), sections.keySet());

        return new ParsedResumeText(rawText, normalizedText, sections);
    }

    private String extractRawText(Resource resource, String mimeType) {
        try (InputStream stream = resource.getInputStream()) {
            Metadata metadata = new Metadata();
            if (mimeType != null && !mimeType.isBlank()) {
                metadata.set("Content-Type", mimeType);
            }

            BodyContentHandler handler = new BodyContentHandler(UNLIMITED_CONTENT_LENGTH);
            ParseContext context = new ParseContext();

            if ("application/pdf".equalsIgnoreCase(mimeType)) {
                PDFParserConfig pdfConfig = new PDFParserConfig();
                pdfConfig.setSortByPosition(true);
                context.set(PDFParserConfig.class, pdfConfig);
            }

            tikaParser.parse(stream, handler, metadata, context);
            return handler.toString();
        } catch (IOException e) {
            throw new ResumeParsingException("Could not read resume file for parsing.", e);
        } catch (TikaException | SAXException e) {
            throw new ResumeParsingException(
                    "Apache Tika could not extract text from the resume document. The file may be corrupt, encrypted, or unsupported.",
                    e
            );
        }
    }

    private String normalize(String rawText) {
        if (rawText == null || rawText.isBlank()) return "";

        String text = Normalizer.normalize(rawText, Normalizer.Form.NFC)
                .replace("\r\n", "\n")
                .replace("\r", "\n");

        text = TRAILING_WHITESPACE.matcher(text).replaceAll("");

        StringBuilder normalized = new StringBuilder(text.length());
        for (String line : text.split("\n", -1)) {
            normalized.append(INLINE_WHITESPACE.matcher(line).replaceAll(" ")).append('\n');
        }

        return EXCESSIVE_BLANK_LINES.matcher(normalized.toString()).replaceAll("\n\n").strip();
    }

    private Map<String, String> extractSections(String normalizedText) {
        Map<String, String> sections = new LinkedHashMap<>();
        if (normalizedText == null || normalizedText.isBlank()) return sections;

        String[] lines = normalizedText.split("\n", -1);
        String currentSection = "CONTACT";
        StringBuilder currentContent = new StringBuilder();
        StringBuilder contactContent = new StringBuilder();

        for (String line : lines) {
            HeaderMatch match = detectSectionHeader(line);
            if (match != null) {
                saveSectionContent(sections, currentSection, currentContent.toString());
                currentSection = match.canonicalCategory();
                currentContent = new StringBuilder();
                if (!match.inlineContent().isBlank()) {
                    currentContent.append(match.inlineContent()).append('\n');
                }
                continue;
            }

            if (!"CONTACT".equals(currentSection) && isContactLine(line)) {
                contactContent.append(line).append('\n');
            } else {
                currentContent.append(line).append('\n');
            }
        }

        saveSectionContent(sections, currentSection, currentContent.toString());
        saveSectionContent(sections, "CONTACT", contactContent.toString());

        if (sections.isEmpty()) {
            sections.put("GENERAL", normalizedText);
        }
        return sections;
    }

    private void saveSectionContent(Map<String, String> sections, String category, String content) {
        if (category == null || content == null || content.isBlank()) return;
        String cleaned = removeDuplicateBlocks(normalize(content));
        if (cleaned.isBlank()) return;

        sections.merge(category, cleaned, this::mergeWithoutDuplicateBlocks);
    }

    private String mergeWithoutDuplicateBlocks(String first, String second) {
        return removeDuplicateBlocks(first + "\n\n" + second);
    }

    /**
     * Removes exact repeated multi-line blocks commonly produced by PDF text
     * layers. A minimum two-line block is required to avoid deleting legitimate
     * repeated single lines such as common skills.
     */
    private String removeDuplicateBlocks(String text) {
        if (text == null || text.isBlank()) return "";

        List<String> lines = new ArrayList<>();
        for (String line : text.split("\n", -1)) {
            lines.add(line == null ? "" : line.trim());
        }

        boolean changed;
        do {
            changed = false;

            outer:
            for (int start = 0; start < lines.size(); start++) {
                int maxBlockLength = (lines.size() - start) / 2;
                for (int blockLength = maxBlockLength; blockLength >= 2; blockLength--) {
                    int secondStart = start + blockLength;
                    if (secondStart + blockLength > lines.size()) continue;

                    boolean identical = true;
                    for (int offset = 0; offset < blockLength; offset++) {
                        if (!comparisonLine(lines.get(start + offset))
                                .equals(comparisonLine(lines.get(secondStart + offset)))) {
                            identical = false;
                            break;
                        }
                    }

                    if (!identical) continue;
                    for (int i = 0; i < blockLength; i++) {
                        lines.remove(secondStart);
                    }
                    changed = true;
                    break outer;
                }
            }
        } while (changed);

        StringBuilder result = new StringBuilder();
        boolean previousBlank = false;
        for (String line : lines) {
            if (line.isBlank()) {
                if (!previousBlank) result.append('\n');
                previousBlank = true;
            } else {
                result.append(line).append('\n');
                previousBlank = false;
            }
        }
        return result.toString().strip();
    }

    private String comparisonLine(String line) {
        return line == null ? "" : line.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private boolean isContactLine(String line) {
        if (line == null || line.isBlank()) return false;
        String trimmed = line.trim();
        String lower = trimmed.toLowerCase();

        if (EMAIL_PATTERN.matcher(trimmed).find()) return true;
        if (CONTACT_URL_PATTERN.matcher(trimmed).find()) return true;

        if (lower.matches("^(email|e-mail|phone|mobile|telephone|tel|linkedin|github|portfolio|website)\\s*[:\\-].*")) {
            return true;
        }

        int digits = trimmed.replaceAll("\\D", "").length();
        return digits >= 9 && digits <= 15 && trimmed.matches(".*\\d.*");
    }

    private HeaderMatch detectSectionHeader(String line) {
        if (line == null || line.isBlank() || line.length() > 100) return null;

        String trimmed = line.trim();
        String whole = normalizeHeaderCandidate(trimmed);
        if (HEADER_VARIANTS.containsKey(whole)) {
            return new HeaderMatch(HEADER_VARIANTS.get(whole), "");
        }

        int colon = trimmed.indexOf(':');
        if (colon > 0 && colon < 50) {
            String prefix = normalizeHeaderCandidate(trimmed.substring(0, colon));
            String suffix = trimmed.substring(colon + 1).trim();
            if (HEADER_VARIANTS.containsKey(prefix)
                    && !("LANGUAGES".equals(prefix)
                    || "TECHNOLOGIES".equals(prefix)
                    || "TECH STACK".equals(prefix)
                    || "TOOLS".equals(prefix))) {
                return new HeaderMatch(HEADER_VARIANTS.get(prefix), suffix);
            }
        }

        return null;
    }

    private String normalizeHeaderCandidate(String text) {
        if (text == null) return "";
        return text.replaceAll("^[0-9]+[\\.\\)\\-]?\\s*", "")
                .replaceAll("^[•\\-\\*%#_\\=\\[\\]\\(\\)]+\\s*", "")
                .toUpperCase()
                .replaceAll("[^A-Z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static void register(String variant, String canonical) {
        HEADER_VARIANTS.put(
                variant.toUpperCase()
                        .replaceAll("[^A-Z0-9 ]", " ")
                        .replaceAll("\\s+", " ")
                        .trim(),
                canonical
        );
    }

    public record HeaderMatch(String canonicalCategory, String inlineContent) {}
}
