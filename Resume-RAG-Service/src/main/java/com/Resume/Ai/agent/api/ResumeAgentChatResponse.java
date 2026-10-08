package com.Resume.Ai.agent.api;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;
import java.util.List;

@Value
@Builder
public class ResumeAgentChatResponse {

    UUID conversationId;
    String reply;
    boolean requiresUserApproval;
    List<String> toolTrace;
}
