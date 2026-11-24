# Resume Service — Architecture and Integration Context

## Service role
The Resume Service owns candidate resume uploads, parsed/structured resume data, resume builder content, ATS analysis, RAG chat, resume versions, job descriptions, job matching, and job discovery. Default port is `8082`; primary API prefix is `/api/resumes`. It uses PostgreSQL, Redis, Spring AI, Groq-compatible chat models, Gemini embeddings/PGVector, and external job search configuration as defined in `application.yml`.

## Identity and authorization
The browser calls the API Gateway with its HttpOnly access-token cookie. The Gateway validates the JWT and injects `X-Authenticated-User-Id`; the service does not issue or independently validate user JWTs. Controllers pass the UUID to services, which must verify ownership for every user-owned resume, version, conversation, match, and job description. Do not accept user identity from a request body.

The Interview Service is a trusted internal caller. It sends the same user UUID plus `X-Internal-Service-Name: interview-service` and `X-Internal-Service-Token`. Resume Service checks the internal token for marked Interview Service calls and still checks that the requested resume belongs to the forwarded user.

## Main API groups present in the supplied source
- Resume CRUD/upload/download/details/overview/ATS: `/api/resumes`
- Resume profile for Interview Service: `GET /api/resumes/{resumeId}/profile`
- Resume RAG chat: `POST /api/resumes/chat`
- Resume builder: `/api/resumes/builder` and `/api/resumes/{resumeId}/builder`
- Resume versions: `/api/resumes/{resumeId}/versions`
- Job matching: `/api/resumes/{resumeId}/match` and `/api/resumes/{resumeId}/match/{matchId}`
- Job search: `/api/resumes/jobs/search`, `/for-me`, and `/{jobId}`
- Saved job descriptions: `/api/job-descriptions`
- Health: `GET /health`

## Interview integration contract
Interview Service currently uses:
- `GET /api/resumes/details` to resolve the active resume ID
- `GET /api/resumes/{resumeId}/profile` to load structured profile context

The profile response is mapped into the Interview Service's candidate context and snapshotted when a session is created. The Interview Service verifies the returned candidate UUID matches the authenticated UUID. A session then retains the candidate snapshot even if the resume changes later.

## Security fixes included in this update
- Interview-to-Resume requests now require the shared internal credential.
- Job-description read/delete endpoints now require authenticated identity and enforce owner matching.
- Job-matching service no longer treats a missing authenticated UUID as permission to skip ownership validation.
- Removed Resume Service's unused public update/delete/read overloads that bypassed user identity; ownership validation now rejects a null user UUID.
- Existing resume ownership checks remain the source of truth for resume-specific resources.

## Deployment requirements
Keep ports `8082` and `8083` private. Public clients must use the API Gateway. Gateway must strip/overwrite identity headers and remove client-supplied `X-Internal-Service-*` headers. Set `INTERVIEW_TO_RESUME_INTERNAL_TOKEN` to the same high-entropy value in both services. Use TLS between hosts and consider mTLS/workload identity for production.
