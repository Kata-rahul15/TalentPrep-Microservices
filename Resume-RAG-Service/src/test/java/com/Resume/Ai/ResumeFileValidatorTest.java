package com.Resume.Ai;

import com.Resume.Ai.config.ResumeValidationProperties;
import com.Resume.Ai.exception.InvalidResumeFileException;
import com.Resume.Ai.exception.UnsupportedResumeFormatException;
import com.Resume.Ai.validation.ResumeFileValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link ResumeFileValidator}.
 *
 * <p>Uses {@link MockMultipartFile} with real PDF/DOCX magic bytes to exercise Tika's
 * MIME sniffing. No Spring context needed — pure JUnit 5 tests.</p>
 */
class ResumeFileValidatorTest {

    private ResumeFileValidator validator;

    /** Minimal PDF header bytes — Tika detects these as application/pdf */
    private static final byte[] PDF_MAGIC = "%PDF-1.4\n%%EOF".getBytes();

    /**
     * Minimal DOCX magic bytes (PK zip signature).
     * Note: a raw PK header is detected as application/zip by Tika, not DOCX,
     * because full DOCX detection requires the internal directory structure.
     * We test with the filename hint + content-type, and separately test Tika sniffing rejection.
     */
    private static final byte[] ZIP_MAGIC = new byte[]{0x50, 0x4B, 0x03, 0x04};

    @BeforeEach
    void setUp() {
        ResumeValidationProperties props = new ResumeValidationProperties();
        props.setMaxFileSizeBytes(10_485_760L);
        props.setAllowedMimeTypes(List.of(
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ));
        validator = new ResumeFileValidator(props);
    }

    // ──────────────────────────────────────────────
    // Null / empty
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("Null file → InvalidResumeFileException")
    void validate_nullFile_throws() {
        assertThatThrownBy(() -> validator.validate(null))
                .isInstanceOf(InvalidResumeFileException.class)
                .hasMessageContaining("No file was provided");
    }

    @Test
    @DisplayName("Empty file → InvalidResumeFileException")
    void validate_emptyFile_throws() {
        MockMultipartFile empty = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> validator.validate(empty))
                .isInstanceOf(InvalidResumeFileException.class)
                .hasMessageContaining("empty");
    }

    // ──────────────────────────────────────────────
    // Filename checks
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("Missing filename → InvalidResumeFileException")
    void validate_missingFilename_throws() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "", "application/pdf", PDF_MAGIC);

        assertThatThrownBy(() -> validator.validate(file))
                .isInstanceOf(InvalidResumeFileException.class)
                .hasMessageContaining("Filename");
    }

    @Test
    @DisplayName("Unsupported extension (.txt) → UnsupportedResumeFormatException before MIME sniff")
    void validate_txtExtension_throwsUnsupportedFormat() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.txt", "text/plain", "plain text".getBytes());

        assertThatThrownBy(() -> validator.validate(file))
                .isInstanceOf(UnsupportedResumeFormatException.class)
                .hasMessageContaining(".txt");
    }

    @Test
    @DisplayName("Filename too long (256 chars) → InvalidResumeFileException")
    void validate_tooLongFilename_throws() {
        String longName = "a".repeat(252) + ".pdf";
        MockMultipartFile file = new MockMultipartFile(
                "file", longName, "application/pdf", PDF_MAGIC);

        assertThatThrownBy(() -> validator.validate(file))
                .isInstanceOf(InvalidResumeFileException.class)
                .hasMessageContaining("too long");
    }

    // ──────────────────────────────────────────────
    // Size checks
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("File over size limit → InvalidResumeFileException")
    void validate_fileTooLarge_throws() {
        // Create properties with a tiny limit
        ResumeValidationProperties props = new ResumeValidationProperties();
        props.setMaxFileSizeBytes(10L); // 10 bytes max
        props.setAllowedMimeTypes(List.of("application/pdf"));
        ResumeFileValidator strictValidator = new ResumeFileValidator(props);

        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", PDF_MAGIC);

        assertThatThrownBy(() -> strictValidator.validate(file))
                .isInstanceOf(InvalidResumeFileException.class)
                .hasMessageContaining("exceeds");
    }

    // ──────────────────────────────────────────────
    // MIME sniffing
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("Valid PDF bytes with .pdf extension → passes validation")
    void validate_validPdf_passes() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", PDF_MAGIC);

        // Should not throw
        assertThatCode(() -> validator.validate(file)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("HTML bytes with .pdf extension → UnsupportedResumeFormatException (Tika sniffs)")
    void validate_htmlBytesWithPdfExtension_throwsUnsupportedFormat() {
        byte[] htmlBytes = "<html><body>Not a PDF</body></html>".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", htmlBytes);

        // Tika detects text/html from the bytes regardless of the extension
        assertThatThrownBy(() -> validator.validate(file))
                .isInstanceOf(UnsupportedResumeFormatException.class);
    }
}
