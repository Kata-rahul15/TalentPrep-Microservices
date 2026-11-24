package com.talentprep.interview.client;

import com.talentprep.interview.client.dto.ResumeProfileDto;
import com.talentprep.interview.client.dto.ResumeSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;
import java.util.UUID;

@FeignClient(
        name = "resume-service",
        url = "${services.resume.url:http://localhost:8082}",
        configuration = FeignClientConfig.class
)
public interface ResumeServiceFeignClient {

    @GetMapping("/api/resumes/profile")
    ResumeProfileDto getActiveProfile(
            @RequestHeader("X-Authenticated-User-Id") String authenticatedUserId,
            @RequestHeader("X-User-Id") String fallbackUserId
    );

    @GetMapping("/api/resumes/{resumeId}/profile")
    ResumeProfileDto getResumeProfile(
            @PathVariable("resumeId") UUID resumeId,
            @RequestHeader("X-Authenticated-User-Id") String authenticatedUserId,
            @RequestHeader("X-User-Id") String fallbackUserId
    );

    @GetMapping("/api/resumes/me")
    List<ResumeSummaryDto> getMyResumes(
            @RequestHeader("X-Authenticated-User-Id") String authenticatedUserId,
            @RequestHeader("X-User-Id") String fallbackUserId
    );
}

