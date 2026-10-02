package com.Resume.Ai.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileStorageService {

    StoredFile store(UUID resumeId, MultipartFile file);

    Resource download(String storagePath);

    void delete(String storagePath);

    boolean exists(String storagePath);
}