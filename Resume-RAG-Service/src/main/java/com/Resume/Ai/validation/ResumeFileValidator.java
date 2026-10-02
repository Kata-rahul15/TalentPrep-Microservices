package com.Resume.Ai.validation;

import com.Resume.Ai.config.ResumeValidationProperties;
import com.Resume.Ai.exception.InvalidResumeFileException;
import com.Resume.Ai.exception.UnsupportedResumeFormatException;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

@Component
public class ResumeFileValidator {

    private static final Logger log = LoggerFactory.getLogger(ResumeFileValidator.class);

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "docx");
    private static final int FILENAME_MAX_LENGTH = 255;

    private final ResumeValidationProperties validationProperties;
    private final Tika tika;

    public ResumeFileValidator(ResumeValidationProperties validationProperties) {
        this.validationProperties = validationProperties;
        this.tika = new Tika();
    }

    public void validate(MultipartFile file) {
        checkNotNull(file);
        checkNotEmpty(file);
        checkFilename(file);
        checkFileSize(file);
        checkMimeType(file);
    }

    private void checkNotNull(MultipartFile file) {
        if (file == null) {
            throw new InvalidResumeFileException("No file was provided in the request.");
        }
    }

    private void checkNotEmpty(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidResumeFileException("The uploaded file is empty.");
        }
    }

    private void checkFilename(MultipartFile file) {
        String filename = file.getOriginalFilename();

        if (filename == null || filename.isBlank()) {
            throw new InvalidResumeFileException("Filename is missing or blank.");
        }
        if (filename.length() > FILENAME_MAX_LENGTH) {
            throw new InvalidResumeFileException("Filename is too long (max " + FILENAME_MAX_LENGTH + " characters).");
        }

        String extension = extractExtension(filename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new UnsupportedResumeFormatException(
                    "File extension '." + extension + "' is not supported. "
                    + "Please upload a PDF or DOCX file.");
        }
    }

    private void checkFileSize(MultipartFile file) {
        long maxBytes = validationProperties.getMaxFileSizeBytes();
        if (file.getSize() > maxBytes) {
            throw new InvalidResumeFileException(
                    "File size (" + file.getSize() + " bytes) exceeds the maximum allowed size of "
                    + maxBytes + " bytes (" + (maxBytes / 1_048_576) + " MB).");
        }
    }

    private void checkMimeType(MultipartFile file) {
        String detectedMimeType;
        try {
            detectedMimeType = tika.detect(file.getInputStream(), file.getOriginalFilename());
        } catch (IOException e) {
            log.warn("MIME detection failed for '{}'; falling back to Content-Type header.",
                    file.getOriginalFilename());
            detectedMimeType = file.getContentType();
        }

        if (detectedMimeType == null) {
            throw new UnsupportedResumeFormatException(
                    "Could not determine the file type. Please upload a PDF or DOCX file.");
        }

        if (!validationProperties.getAllowedMimeTypes().contains(detectedMimeType)) {
            throw new UnsupportedResumeFormatException(
                    "Detected file type '" + detectedMimeType + "' is not supported. "
                    + "Allowed types: PDF and DOCX.");
        }

        log.debug("MIME type validation passed: {}", detectedMimeType);
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1);
    }
}
