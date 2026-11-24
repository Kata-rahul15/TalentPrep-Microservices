package com.talentprep.interview.client;

import com.talentprep.interview.client.dto.ResumeProfileDto;
import com.talentprep.interview.client.dto.ResumeSummaryDto;
import com.talentprep.interview.exception.ResumeIntegrationException;
import feign .FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * OpenFeign-based implementation of {@link ResumeServiceClient}.
 * Communicates with Resume Service using Spring Cloud OpenFeign.
 */
@Component
@Primary
public class OpenFeignResumeServiceClient implements ResumeServiceClient {

    private static final Logger log = LoggerFactory.getLogger(OpenFeignResumeServiceClient.class);

    private final ResumeServiceFeignClient feignClient;

    public OpenFeignResumeServiceClient(ResumeServiceFeignClient feignClient) {
        this.feignClient = feignClient;
    }

    @Override
    public ResumeProfileDto getResumeProfile(UUID resumeId, UUID userId) {
        if (resumeId == null) {
            throw new IllegalArgumentException("resumeId must not be null.");
        }
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null.");
        }

        log.info("[OpenFeignResumeServiceClient] Resume-service Feign request: resumeId={}, userId={}", resumeId, userId);

        try {
            return feignClient.getResumeProfile(resumeId, userId.toString(), userId.toString());
        } catch (FeignException.NotFound ex) {
            log.warn("Resume profile not found via Feign (404): resumeId={}, userId={}", resumeId, userId);
            throw new ResumeIntegrationException("Resume not found or unauthorized access: " + resumeId);
        } catch (FeignException ex) {
            log.error("Resume Service returned Feign error {}: resumeId={}, userId={}", ex.status(), resumeId, userId);
            throw new ResumeIntegrationException("Resume Service returned error (" + ex.status() + "): " + ex.getMessage(), ex);
        } catch (Exception ex) {
            log.error("Failed to connect to Resume Service via Feign: resumeId={}, userId={}", resumeId, userId, ex);
            throw new ResumeIntegrationException("Failed to retrieve resume profile from Resume Service: " + ex.getMessage(), ex);
        }
    }

    @Override
    public ResumeProfileDto getActiveResumeProfile(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null.");
        }

        log.info("[OpenFeignResumeServiceClient] Resume-service Feign request (active profile): userId={}", userId);

        // Optimization: Try to fetch active profile in a single Feign call
        try {
            return feignClient.getActiveProfile(userId.toString(), userId.toString());
        } catch (FeignException.NotFound ex) {
            log.info("No active resume profile found (404) for user {}", userId);
            return null;
        } catch (Exception ex) {
            log.debug("Direct active profile endpoint unavailable or failed, falling back to resumes list: {}", ex.getMessage());
        }

        try {
            List<ResumeSummaryDto> resumes = feignClient.getMyResumes(userId.toString(), userId.toString());
            if (resumes == null || resumes.isEmpty()) {
                log.info("No resumes found for user {}", userId);
                return null;
            }

            // Pick the first available resume from user's active resumes
            UUID activeResumeId = resumes.get(0).getId();
            log.info("Found active resume {} for user {}", activeResumeId, userId);
            return getResumeProfile(activeResumeId, userId);
        } catch (FeignException.NotFound ex) {
            log.info("No resumes found (404) for user {}", userId);
            return null;
        } catch (ResumeIntegrationException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to locate active resume profile via Feign for user {}", userId, ex);
            throw new ResumeIntegrationException("Could not retrieve active resume: " + ex.getMessage(), ex);
        }
    }
}

