package com.talentprep.interview.client;

import com.talentprep.interview.client.dto.ResumeProfileDto;
import java.util.UUID;

public interface ResumeServiceClient {

    ResumeProfileDto getResumeProfile(UUID resumeId, UUID userId);

    ResumeProfileDto getActiveResumeProfile(UUID userId);
}

