# TalentPrep Security Architecture – Cross-Service Contract

## Decision

Use Gateway-centric user authentication with service-level resource authorization and private service networking. Do not add independent login flows or duplicate token issuance in Resume or Interview Service.

## Request path

1. Browser sends the HttpOnly `AccessToken` cookie to API Gateway.
2. Auth Service is the sole token issuer. Current token format is HS256, with `sub=email` and `userId=<UUID>`.
3. Gateway validates signature and expiry, checks Redis revocation state, requires a non-empty subject and UUID userId claim, strips any client-supplied identity headers, then injects trusted identity headers.
4. Resume and Interview services accept those identity headers only from the private network/Gateway path and perform resource ownership checks on every user-owned resource.
5. Interview WebSocket handshake follows the same path; STOMP Principal is created from the request identity established by `GatewayIdentityFilter`.

## Non-negotiable boundaries

- Expose only API Gateway to the public internet. Do not expose service ports 8081, 8082, or 8083.
- Never trust browser-provided `X-Authenticated-User-Id`, `X-Authenticated-User-Email`, `X-User-Id`, or `X-User-Email` headers.
- Do not pass the HS256 signing secret to Resume or Interview Service.
- Do not accept a userId from a request body as an authorization identity.
- Every resume, interview, transcript, report, answer, and other user-owned resource must be checked against the authenticated user ID in the owning service.
- Cookie-authenticated unsafe HTTP requests require the Gateway-issued double-submit CSRF token. STOMP CONNECT requires the matching token and an allowed Origin.
- Redis revocation lookup failures must fail closed (HTTP 503), not silently treat tokens as active.

## Service-to-service calls

The Interview-to-Resume integration forwards the authenticated user UUID in identity headers and sends `X-Internal-Service-Name: interview-service` plus `X-Internal-Service-Token`. Resume Service validates the shared high-entropy credential for marked service calls and independently checks that the requested resume belongs to the forwarded user UUID. Configure the same `INTERVIEW_TO_RESUME_INTERNAL_TOKEN` environment variable in both services. The Interview client fails startup if the token is blank; Resume Service fails marked calls closed if its configured token is blank or does not match. Do not use a browser user JWT as a service credential. Keep both services on a private network and use TLS; mTLS/workload identity remains the stronger production direction.

## Future hardening

The current Auth/Gateway token format uses a shared HS256 secret. A planned improvement is asymmetric signing (RS256 or ES256): Auth keeps the private signing key; Gateway receives only the public verification key. This reduces the impact of a compromised Gateway. This update intentionally does not rotate token algorithms because doing so requires coordinated key rollout and active-token compatibility handling.

Other follow-ups: persistent WebSocket command idempotency, shared STOMP broker for horizontal scaling, rate limiting on expensive AI endpoints, secrets manager, audit events, and service-to-service mTLS.
