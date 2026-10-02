# Resume AI Complete API Overview & Frontend Integration Guide

**Base URL**: `http://localhost:8080`  
**Authentication Header**: `X-User-Id: <uuid>` (Injected by API Gateway)

---

## Complete End-to-End User Flow

```
1. UPLOAD RESUME
   POST /api/resumes/upload
   (Multipart form: file + resumeName)
            │
            ▼
   Returns status: READY (Parsed, Chunked & Vector Indexed in pgvector)

2. CREATE JOB DESCRIPTION
   POST /api/job-descriptions
   (JSON: title + description + companyName)
            │
            ▼
   Returns JobDescription JSON with ID

3. RAG CHAT OVER RESUME
   POST /api/resumes/{resumeId}/chat
   (JSON: question)
            │
            ▼
   Returns Grounded Answer + Source Metadata

4. JOB MATCHING & ANALYSIS
   POST /api/resumes/{resumeId}/match
   (JSON: jobDescriptionId)
            │
            ▼
   Returns Match Score (0-100), Matching Skills, Missing Skills, Evidence & Recommendations
```

---

## API Summary Table

| Category | Method | Path | Description |
|---|---|---|---|
| **Resume** | `POST` | `/api/resumes/upload` | Upload & process resume file |
| **Resume** | `GET` | `/api/resumes/{resumeId}` | Get full details of a resume |
| **Resume** | `GET` | `/api/resumes/user/{userId}` | List all resumes for a user |
| **Resume** | `PATCH` | `/api/resumes/{resumeId}` | Update resume name or active state |
| **Resume** | `DELETE` | `/api/resumes/{resumeId}` | Delete resume, chunks & vectors |
| **RAG Chat** | `POST` | `/api/resumes/{resumeId}/chat` | Ask grounded questions about resume |
| **Job Description** | `POST` | `/api/job-descriptions` | Save a job description |
| **Job Description** | `GET` | `/api/job-descriptions/{id}` | Get job description details |
| **Job Description** | `GET` | `/api/job-descriptions/user/{userId}` | List user's job descriptions |
| **Job Description** | `DELETE` | `/api/job-descriptions/{id}` | Delete job description |
| **Job Matching** | `POST` | `/api/resumes/{resumeId}/match` | Compare resume vs JD for score & analysis |
