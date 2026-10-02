package com.Resume.Ai;

import com.Resume.Ai.config.ResumeStorageProperties;
import com.Resume.Ai.exception.ResumeStorageException;
import com.Resume.Ai.storage.FileStorageService;
import com.Resume.Ai.storage.LocalFileStorageService;
import com.Resume.Ai.storage.StoredFile;
import org.junit.jupiter.api.*;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class FileStorageServiceTest {

    private Path tempDir;
    private FileStorageService storageService;
    private static final UUID RESUME_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() throws IOException {
        tempDir = Files.createTempDirectory("resume-storage-test-");
        ResumeStorageProperties props = new ResumeStorageProperties();
        props.setBasePath(tempDir.toString());
        storageService = new FileStorageService() {
            @Override
            public StoredFile store(UUID resumeId, MultipartFile file) {
                return null;
            }

            @Override
            public Resource download(String storagePath) {
                return null;
            }

            @Override
            public void delete(String storagePath) {

            }

            @Override
            public boolean exists(String storagePath) {
                return false;
            }
        };
    }

    @AfterEach
    void tearDown() throws IOException {
        Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .forEach(p -> {
                    try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                });
    }

    @Test
    @DisplayName("store() — creates file under {resumeId}/ directory")
    void store_validFile_createsFileInCorrectDirectory() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "PDF content".getBytes());

        StoredFile result = storageService.store(RESUME_ID, file);

        assertThat(result).isNotNull();
        assertThat(result.storedFilename()).isEqualTo("resume.pdf");
        assertThat(result.storagePath()).isEqualTo(RESUME_ID + "/resume.pdf");
        assertThat(result.mimeType()).isEqualTo("application/pdf");
        assertThat(result.sizeBytes()).isPositive();

        Path expectedPath = tempDir.resolve(RESUME_ID.toString()).resolve("resume.pdf");
        assertThat(Files.exists(expectedPath)).isTrue();
        assertThat(Files.readAllBytes(expectedPath)).isEqualTo("PDF content".getBytes());
    }

    @Test
    @DisplayName("store() — sanitises filename with special characters")
    void store_fileWithSpecialCharacters_sanitisesFilename() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "my résumé (2024).pdf", "application/pdf", "PDF".getBytes());

        StoredFile result = storageService.store(RESUME_ID, file);

        assertThat(result.storedFilename()).doesNotContain(" ", "é");
        assertThat(result.storedFilename()).endsWith(".pdf");
    }

    @Test
    @DisplayName("store() — null original filename falls back to 'resume'")
    void store_nullFilename_usesDefaultName() {
        MockMultipartFile file = new MockMultipartFile(
                "file", null, "application/pdf", "PDF".getBytes());

        StoredFile result = storageService.store(RESUME_ID, file);

        assertThat(result.storedFilename()).isEqualTo("resume");
    }

    @Test
    @DisplayName("download() — returns readable Resource for stored file")
    void download_storedFile_returnsReadableResource() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "Hello PDF".getBytes());
        StoredFile stored = storageService.store(RESUME_ID, file);

        Resource resource = storageService.download(stored.storagePath());

        assertThat(resource).isNotNull();
        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
        assertThat(resource.getInputStream().readAllBytes()).isEqualTo("Hello PDF".getBytes());
    }

    @Test
    @DisplayName("download() — non-existent path throws ResumeStorageException")
    void download_nonExistentPath_throws() {
        assertThatThrownBy(() -> storageService.download(RESUME_ID + "/missing.pdf"))
                .isInstanceOf(ResumeStorageException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("delete() — removes stored file from filesystem")
    void delete_existingFile_removesFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "PDF".getBytes());
        StoredFile stored = storageService.store(RESUME_ID, file);

        storageService.delete(stored.storagePath());

        Path expectedPath = tempDir.resolve(RESUME_ID.toString()).resolve("resume.pdf");
        assertThat(Files.exists(expectedPath)).isFalse();
    }

    @Test
    @DisplayName("delete() — non-existent file does not throw (idempotent)")
    void delete_nonExistentFile_doesNotThrow() {
        assertThatCode(() -> storageService.delete(RESUME_ID + "/ghost.pdf"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("exists() — returns true for stored file, false for missing file")
    void exists_storedAndMissingFiles_returnsCorrectly() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "PDF".getBytes());
        StoredFile stored = storageService.store(RESUME_ID, file);

        assertThat(storageService.exists(stored.storagePath())).isTrue();
        assertThat(storageService.exists(RESUME_ID + "/nonexistent.pdf")).isFalse();
    }

    @Test
    @DisplayName("download() — path traversal attempt throws ResumeStorageException")
    void download_pathTraversalAttempt_throws() {
        assertThatThrownBy(() -> storageService.download("../../etc/passwd"))
                .isInstanceOf(ResumeStorageException.class)
                .hasMessageContaining("path");
    }
}
