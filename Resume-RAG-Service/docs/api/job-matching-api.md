# Job Description Matching API Contract

**Service**: Resume AI Backend  
**Base URL**: `http://localhost:8080`  
**Version**: 3.0 (Stage 3 — Job Matching)  
**Date**: 2026-08-13

---

## Endpoint Specification

### Match Resume Against Job Description

Compares a user's uploaded resume with a target Job Description using Spring AI, vector store evidence retrieval, and Gemini AI. Returns a deterministic weighted score (0–100), matched skills, missing skills, evidence snippets, and recommendations.

```http
POST /api/resumes/{resumeId}/match
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
  "jobDescriptionId": "770e8400-e29b-41d4-a716-446655440002"
}
```

#### Successful Response — `200 OK`

```json
{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "jobDescriptionId": "770e8400-e29b-41d4-a716-446655440002",
  "matchScore": 85,
  "summary": "Strong match for Senior Java Developer role.",
  "matchingSkills": [
    {
      "skill": "Java",
      "matchType": "MATCH",
      "evidence": "Demonstrated 5 years of Java backend microservices experience."
    },
    {
      "skill": "Spring Boot",
      "matchType": "MATCH",
      "evidence": "Built REST APIs with Spring Boot."
    }
  ],
  "missingSkills": [
    {
      "skill": "Kubernetes",
      "importance": "PREFERRED",
      "suggestion": "Mention any container orchestration tools used in previous projects."
    }
  ],
  "evidence": [
    {
      "requirement": "Java",
      "section": "SKILLS",
      "snippet": "Java 17, Spring Boot, Microservices",
      "score": 0.89
    }
  ],
  "recommendations": [
    "Highlight experience with container deployment."
  ]
}
```

#### Error Responses

| Status | Error Reason | Response Body |
|---|---|---|
| `400 Bad Request` | `jobDescriptionId` is missing or null | `{"timestamp":"...","status":400,"error":"Bad Request","message":"jobDescriptionId must not be null."}` |
| `403 Forbidden` | Authenticated user does not own resume | `{"timestamp":"...","status":403,"error":"Forbidden","message":"You are not authorized to access this resume."}` |
| `404 Not Found` | Resume or Job Description not found | `{"timestamp":"...","status":404,"error":"Not Found","message":"Job description not found with id: ..."}` |
| `500 Internal Server Error` | AI evaluation or matching failure | `{"timestamp":"...","status":500,"error":"Internal Server Error","message":"An error occurred during job matching analysis."}` |
