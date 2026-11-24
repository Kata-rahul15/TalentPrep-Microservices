package com.talentprep.interview.websocket.security;

import java.security.Principal;
import java.util.UUID;

public record InterviewPrincipal(UUID userId, String email) implements Principal {
    @Override
    public String getName() {
        return userId.toString();
    }
}
