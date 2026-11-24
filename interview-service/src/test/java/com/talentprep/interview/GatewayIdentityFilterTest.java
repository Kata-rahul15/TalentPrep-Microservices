package com.talentprep.interview;

import com.talentprep.interview.identity.AuthenticatedUser;
import com.talentprep.interview.identity.GatewayIdentityFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GatewayIdentityFilterTest {
    private GatewayIdentityFilter filter;

    @BeforeEach void setUp() { filter = new GatewayIdentityFilter(); }

    @Test @DisplayName("Stores identity injected by gateway as a request attribute")
    void validGatewayIdentity() throws ServletException, IOException {
        UUID userId = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/interviews/setup");
        request.addHeader(GatewayIdentityFilter.AUTH_USER_ID_HEADER, userId.toString());
        request.addHeader(GatewayIdentityFilter.AUTH_USER_EMAIL_HEADER, "candidate@talentprep.io");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        AuthenticatedUser user = (AuthenticatedUser) request.getAttribute(GatewayIdentityFilter.AUTHENTICATED_USER_ATTRIBUTE);
        assertNotNull(user);
        assertEquals(userId, user.getUserId());
        assertEquals("candidate@talentprep.io", user.getEmail());
        verify(chain).doFilter(request, response);
    }

    @Test @DisplayName("Supports fallback X-User-Id gateway header")
    void fallbackHeader() throws ServletException, IOException {
        UUID userId = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/interviews/setup");
        request.addHeader(GatewayIdentityFilter.FALLBACK_USER_ID_HEADER, userId.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertEquals(userId, ((AuthenticatedUser) request.getAttribute(
                GatewayIdentityFilter.AUTHENTICATED_USER_ATTRIBUTE)).getUserId());
    }

    @Test @DisplayName("Rejects malformed UUID")
    void malformedUuid() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/interviews/setup");
        request.addHeader(GatewayIdentityFilter.AUTH_USER_ID_HEADER, "not-a-uuid");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertEquals(400, response.getStatus());
        verify(chain, never()).doFilter(request, response);
    }

    @Test @DisplayName("Rejects missing identity on protected routes")
    void missingIdentity() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/interviews/setup");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertEquals(401, response.getStatus());
        verify(chain, never()).doFilter(request, response);
    }

    @Test @DisplayName("Allows health check without identity")
    void healthCheck() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertEquals(200, response.getStatus());
        verify(chain).doFilter(request, response);
    }

    @Test @DisplayName("Allows OPTIONS preflight without identity")
    void optionsBypassesIdentity() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/interviews");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertEquals(200, response.getStatus());
        verify(chain).doFilter(request, response);
    }
}
