package com.Resume.Ai.agent.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeAgentMessageRepository extends JpaRepository<ResumeAgentMessage, UUID> {

    List<ResumeAgentMessage> findTop12ByConversationIdAndUserIdAndResumeIdOrderByCreatedAtDesc(UUID conversationId, UUID userId, UUID resumeId);

    void deleteByConversationIdAndUserIdAndResumeId(UUID conversationId, UUID userId, UUID resumeId);

    List<ResumeAgentMessage> findAllByConversationIdAndUserIdAndResumeIdOrderByCreatedAtDesc(
            UUID conversationId, UUID userId, UUID resumeId);
}
