package com.Resume.Ai.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class InternalServiceAuthenticationFilterTest {

    @Test
    void rejectsInterviewServiceCallWithoutToken() throws Exception {
        InternalServiceAuthenticationFilter filter =
                new InternalServiceAuthenticationFilter("a-long-random-secret-value");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/resumes/123/profile");
        request.addHeader(InternalServiceAuthenticationFilter.SERVICE_NAME_HEADER, "interview-service");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(401, response.getStatus());
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void acceptsInterviewServiceCallWithCorrectToken() throws Exception {
        String secret = "a-long-random-secret-value";
        InternalServiceAuthenticationFilter filter = new InternalServiceAuthenticationFilter(secret);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/resumes/123/profile");
        request.addHeader(InternalServiceAuthenticationFilter.SERVICE_NAME_HEADER, "interview-service");
        request.addHeader(InternalServiceAuthenticationFilter.SERVICE_TOKEN_HEADER, secret);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void allowsUnmarkedGatewayRequestToContinueToControllerIdentityChecks() throws Exception {
        InternalServiceAuthenticationFilter filter =
                new InternalServiceAuthenticationFilter("a-long-random-secret-value");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/resumes/details");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
