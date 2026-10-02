package com.Resume.Ai.storage;

import com.Resume.Ai.config.ResumeStorageProperties;
import com.Resume.Ai.exception.ResumeStorageException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@ConditionalOnProperty(
        prefix = "resume.storage",
        name = "type",
        havingValue = "local",
        matchIfMissing = true
)
public class LocalFileStorageService implements FileStorageService {

    private static final Logger log =
            LoggerFactory.getLogger(LocalFileStorageService.class);

    private final Path baseStoragePath;

    public LocalFileStorageService(ResumeStorageProperties properties) {
        this.baseStoragePath = Paths.get(properties.getBasePath())
                .toAbsolutePath()
                .normalize();

        initialiseStorageDirectory();
    }

    @Override
    public StoredFile store(UUID resumeId, MultipartFile file) {

        String filename = sanitiseFilename(file.getOriginalFilename());

        Path resumeDir = baseStoragePath.resolve(resumeId.toString());
        Path targetPath = resumeDir.resolve(filename).normalize();

        guardPathTraversal(targetPath, "store");

        try {
            Files.createDirectories(resumeDir);

            Files.copy(
                    file.getInputStream(),
                    targetPath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String storagePath = resumeId + "/" + filename;

            String mimeType = file.getContentType() != null
                    ? file.getContentType()
                    : "application/octet-stream";

            log.info("Resume stored locally: {}", storagePath);

            return new StoredFile(
                    filename,
                    storagePath,
                    mimeType,
                    file.getSize()
            );

        } catch (IOException e) {
            throw new ResumeStorageException(
                    "Failed to store resume locally", e
            );
        }
    }

    @Override
    public Resource download(String storagePath) {

        Path filePath = resolve(storagePath);
        guardPathTraversal(filePath, "download");

        try {
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new ResumeStorageException(
                        "Resume file not found: " + storagePath
                );
            }

            return resource;

        } catch (MalformedURLException e) {
            throw new ResumeStorageException(
                    "Invalid resume storage path", e
            );
        }
    }

    @Override
    public void delete(String storagePath) {

        Path filePath = resolve(storagePath);
        guardPathTraversal(filePath, "delete");

        try {
            Files.deleteIfExists(filePath);
            log.info("Local resume deleted: {}", storagePath);

        } catch (IOException e) {
            throw new ResumeStorageException(
                    "Failed to delete local resume", e
            );
        }
    }

    @Override
    public boolean exists(String storagePath) {

        Path filePath = resolve(storagePath);

        guardPathTraversal(filePath, "exists");

        return Files.exists(filePath);
    }

    private void initialiseStorageDirectory() {
        try {
            Files.createDirectories(baseStoragePath);
        } catch (IOException e) {
            throw new ResumeStorageException(
                    "Could not initialize local storage", e
            );
        }
    }

    private Path resolve(String storagePath) {
        return baseStoragePath.resolve(storagePath).normalize();
    }

    private void guardPathTraversal(Path path, String operation) {
        if (!path.startsWith(baseStoragePath)) {
            throw new ResumeStorageException(
                    "Invalid storage path during " + operation
            );
        }
    }

    private String sanitiseFilename(String originalFilename) {

        if (originalFilename == null || originalFilename.isBlank()) {
            return "resume";
        }

        String filename = Paths.get(originalFilename)
                .getFileName()
                .toString();

        filename = filename.replaceAll(
                "[^a-zA-Z0-9.\\-_]", "_"
        );

        return filename.isBlank() ? "resume" : filename;
    }
}