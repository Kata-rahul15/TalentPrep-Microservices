
package com.Resume.Ai.storage;

import com.Resume.Ai.config.ResumeStorageProperties;
import com.Resume.Ai.exception.ResumeStorageException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@ConditionalOnProperty(
        prefix = "resume.storage",
        name = "type",
        havingValue = "supabase"
)
public class SupabaseFileStorageService implements FileStorageService {

    private final RestClient restClient;
    private final String bucket;

    public SupabaseFileStorageService(
            RestClient.Builder builder,
            ResumeStorageProperties properties
    ) {

        var config = properties.getSupabase();

        if (config == null ||
                config.getUrl() == null ||
                config.getServiceKey() == null ||
                config.getBucket() == null) {

            throw new IllegalStateException(
                    "Supabase storage configuration is incomplete"
            );
        }

        String baseUrl = config.getUrl().replaceAll("/+$", "");

        this.bucket = config.getBucket();

        this.restClient = builder
                .baseUrl(baseUrl)
                .defaultHeader(
                        "apikey",
                        config.getServiceKey()
                )
                .defaultHeader(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer " + config.getServiceKey()
                )
                .build();

        log.info("Supabase storage initialized for bucket: {}", bucket);
    }

    @Override
    public StoredFile store(UUID resumeId, MultipartFile file) {

        String filename = sanitiseFilename(file.getOriginalFilename());

        String storagePath = resumeId + "/" + filename;

        String mimeType = file.getContentType() != null
                ? file.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        try {
            restClient.post()
                    .uri(objectUri(storagePath))
                    .contentType(MediaType.parseMediaType(mimeType))
                    .header("x-upsert", "false")
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();

            return new StoredFile(
                    filename,
                    storagePath,
                    mimeType,
                    file.getSize()
            );

        } catch (IOException | RuntimeException e) {
            throw new ResumeStorageException(
                    "Failed to upload resume to Supabase", e
            );
        }
    }

    @Override
    public Resource download(String storagePath) {

        try {
            byte[] content = restClient.get()
                    .uri(objectUri(storagePath))
                    .retrieve()
                    .body(byte[].class);

            if (content == null) {
                throw new ResumeStorageException(
                        "Supabase returned an empty resume"
                );
            }

            return new ByteArrayResource(content);

        } catch (RuntimeException e) {
            throw new ResumeStorageException(
                    "Failed to download resume from Supabase", e
            );
        }
    }


    @Override
    public void delete(String storagePath) {
        try {
            restClient
                    .method(HttpMethod.DELETE)
                    .uri("/storage/v1/object/" + bucket)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(Map.of("prefixes", List.of(storagePath)))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Resume deleted from Supabase: {}", storagePath);

        } catch (RuntimeException e) {
            throw new ResumeStorageException(
                    "Failed to delete resume from Supabase", e
            );
        }
    }
    @Override
    public boolean exists(String storagePath) {

        try {
            restClient.get()
                    .uri(objectUri(storagePath))
                    .retrieve()
                    .toBodilessEntity();

            return true;

        } catch (HttpClientErrorException.NotFound e) {
            return false;

        } catch (RuntimeException e) {
            throw new ResumeStorageException(
                    "Could not check resume in Supabase", e
            );
        }
    }

    private URI objectUri(String storagePath) {

        String encodedBucket = UriUtils.encodePathSegment(
                bucket, StandardCharsets.UTF_8
        );

        String encodedObjectPath = UriUtils.encodePath(
                storagePath, StandardCharsets.UTF_8
        );

        return URI.create(
                "/storage/v1/object/" +
                        encodedBucket + "/" +
                        encodedObjectPath
        );
    }

    private String sanitiseFilename(String originalFilename) {

        if (originalFilename == null || originalFilename.isBlank()) {
            return "resume";
        }

        String filename = originalFilename
                .replace("\\", "/");

        filename = filename.substring(
                filename.lastIndexOf('/') + 1
        );

        filename = filename.replaceAll(
                "[^a-zA-Z0-9.\\-_]", "_"
        );

        return filename.isBlank() ? "resume" : filename;
    }
}