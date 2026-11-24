# Interview -> Resume Service: secure integration

## Request contract

Interview Service calls only the existing Resume Service endpoints:

- `GET /api/resumes/details`
- `GET /api/resumes/{resumeId}/profile`

Every call carries:

```http
X-Internal-Service-Name: interview-service
X-Internal-Service-Token: <shared-secret>
X-Authenticated-User-Id: <authenticated-user-uuid>
X-User-Id: <authenticated-user-uuid>
Accept: application/json
```

The internal token authenticates the calling service. The UUID identifies the user whose data is requested. Resume Service must still verify resource ownership; a valid internal token is not permission to read arbitrary users' resumes.

## Configuration

Set the same secret in both processes, using a secret manager or environment variables:

```bash
# Resume Service
INTERVIEW_TO_RESUME_INTERNAL_TOKEN=<same-high-entropy-secret>

# Interview Service
INTERVIEW_TO_RESUME_INTERNAL_TOKEN=<same-high-entropy-secret>
RESUME_SERVICE_URL=http://resume-service:8082
```

Do not commit the value or expose it to the frontend. The Interview Service intentionally refuses to start when this token is blank, preventing accidental downgrade to unauthenticated service calls.

## Network requirements

- Public clients call the API Gateway only.
- Keep Resume Service port `8082` and Interview Service port `8083` private.
- Gateway must strip browser-supplied `X-Internal-Service-Name` and `X-Internal-Service-Token` headers before forwarding.
- Permit service-to-service traffic only from Interview Service to Resume Service.
- Use HTTPS/TLS between services across hosts; plan mTLS/workload identity for stronger workload authentication.

## Failure behavior

- Missing or invalid internal token: Resume Service returns `401 INVALID_INTERNAL_SERVICE_CREDENTIAL`.
- Missing/invalid user identity or resume not owned by that user: existing controller/service authorization rejects the request.
- Resume Service unavailable: Interview Service returns its existing integration failure; it does not fabricate candidate profile data.
