# Resume RAG Chat API Contract

**Service**: Resume AI Backend  
**Base URL**: `http://localhost:8080`  
**Version**: 2.0 (Stage 2 — RAG Pipeline, Embeddings & Gemini Chat)  
**Date**: 2026-08-13

> **Authentication & Ownership Authorization**:  
> Requests must include an `X-User-Id` header (set by API Gateway).  
> The service performs **Ownership Validation (Layer 1 Security)**: if the authenticated user does not own the requested `resumeId`, the request is rejected with `403 Forbidden`.  
> Additionally, vector retrieval enforces **Vector Metadata Filtering (Layer 2 Security)**: `resumeId == requestedResumeId`.

---

## Endpoint Specification

### Ask Question About Resume

Perform grounded conversational search and Q&A over an uploaded resume using Spring AI, PostgreSQL + pgvector, and Gemini.

```http
POST /api/resumes/{resumeId}/chat
Content-Type: application/json
X-User-Id: <uuid>
```

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `resumeId` | `UUID` | ✅ | The unique identifier of the target resume |

#### Headers

| Header | Type | Required | Description |
|---|---|---|---|
| `X-User-Id` | `UUID` | ✅ | Authenticated user ID (injected by API Gateway) |
| `Content-Type` | `String` | ✅ | Must be `application/json` |

#### Request Body

```json
{
  "question": "What backend technologies are present in my resume?"
}
```

#### Validation Rules

- `question`: Must not be null, empty, or blank (`@NotBlank`). HTTP 400 if invalid.
- `resumeId`: Must be a valid UUID. HTTP 400 if malformed.

---

## Responses

### 1. Successful Response — Context Found (`200 OK`)

Returned when relevant resume context passes the similarity threshold (`resume.rag.similarity-threshold: 0.70`).

```json
{
  "answer": "Your resume demonstrates experience with Java, Spring Boot, PostgreSQL, Kafka, and Redis.",
  "sources": [
    {
      "section": "SKILLS",
      "chunkIndex": 0,
      "score": 0.89
    },
    {
      "section": "PROJECTS",
      "chunkIndex": 2,
      "score": 0.82
    }
  ]
}
```

### 2. Successful Response — Low / No Relevant Context (`200 OK`)

Returned when no chunks pass the similarity threshold. The system returns a controlled response instead of an error.

```json
{
  "answer": "The requested information is not present in your resume.",
  "sources": []
}
```

---

## Error Responses

All error responses follow the standard application error structure:

```json
{
  "timestamp": "2026-08-13T12:00:00.000",
  "status": 403,
  "error": "Forbidden",
  "message": "You are not authorized to access this resume."
}
```

| HTTP Status | Error Type | Cause |
|---|---|---|
| `400 Bad Request` | `MethodArgumentNotValidException` | `question` is missing or blank, or malformed JSON |
| `403 Forbidden` | `ResumeUnauthorizedAccessException` | Authenticated user (`X-User-Id`) does not own the specified resume |
| `404 Not Found` | `ResumeNotFoundException` | `resumeId` does not exist in the system |
| `500 Internal Server Error` | `EmbeddingGenerationException` | Failure during text embedding generation |
| `500 Internal Server Error` | `VectorSearchException` | pgvector database search failure |
| `500 Internal Server Error` | `AiServiceException` | Gemini API invocation or model completion failure |

---

## Example cURL Command

```bash
curl -X POST http://localhost:8080/api/resumes/550e8400-e29b-41d4-a716-446655440000/chat \
  -H "X-User-Id: a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"question": "What backend technologies are present in my resume?"}'
```
