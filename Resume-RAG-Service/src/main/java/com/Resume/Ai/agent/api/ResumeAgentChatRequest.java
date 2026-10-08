package com.Resume.Ai.agent.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ResumeAgentChatRequest {

    private UUID conversationId;

    @NotBlank(message = "Message must not be blank.")
    @Size(max = 4000, message = "Message must be at most 4000 characters.")
    private String message;
}
