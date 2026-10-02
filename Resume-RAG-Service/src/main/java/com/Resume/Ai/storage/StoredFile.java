package com.Resume.Ai.storage;

public record StoredFile(
        String storedFilename,
        String storagePath,
        String mimeType,
        long sizeBytes
) {}
