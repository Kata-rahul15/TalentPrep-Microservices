# Job Description API Contract

**Service**: Resume AI Backend  
**Base URL**: `http://localhost:8080`  
**Version**: 3.0 (Stage 3 — Job Descriptions & Matching)  
**Date**: 2026-08-13

---

## Endpoints

### 1. Create Job Description

```http
POST /api/job-descriptions
Content-Type: application/json
X-User-Id: <uuid>
```

#### Request Body
```json
{
  "title": "Java Backend Developer",
  "companyName": "Google",
  "description": "We are looking for a Senior Java Developer with experience in Spring Boot, PostgreSQL, Kafka, and Redis."
}
```

#### Successful Response — `201 Created`
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "jobTitle": "Java Backend Developer",
  "companyName": "Google",
  "description": "We are looking for a Senior Java Developer with experience in Spring Boot, PostgreSQL, Kafka, and Redis.",
  "createdAt": "2026-08-13T12:00:00"
}
```

---

### 2. Get Job Description

```http
GET /api/job-descriptions/{id}
```

#### Successful Response — `200 OK`
Same shape as Create response.

---

### 3. Delete Job Description

```http
DELETE /api/job-descriptions/{id}
```

#### Successful Response — `204 No Content`
Empty body.
