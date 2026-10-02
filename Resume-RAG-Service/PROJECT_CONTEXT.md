# PROJECT CONTEXT - Resume AI Backend

## Overview
Resume AI Backend is a production-grade Spring Boot application providing automated resume processing, text parsing, section extraction, conversational RAG Q&A, and Job Description Matching & Analysis powered by Spring AI, PostgreSQL + pgvector, and Gemini.

---

## Architectural Layout

```
                                  +---------------------------+
                                  | Authenticated User        |
                                  +-------------+-------------+
                                                |
                                                | POST /api/resumes/{resumeId}/match
                                                v
                                  +---------------------------+
                                  |   JobMatchingController   |
                                  +-------------+-------------+
                                                |
                                                v
                                  +---------------------------+
                                  |    JobMatchingService     |
                                  +--+-------+-------------+--+
                                     |       |             |
            [1. Authorize & Fetch]   |       |             | [4. Evaluate Match]
                                     v       |             v
                        +-----------------+  |  +---------------------+
                        | JobDescription  |  |  | Spring AI ChatClient|
                        |   Repository    |  |  |      (Gemini)       |
                        +-----------------+  |  +---------------------+
                                             |
            [2. Extract Requirements]        | [3. Retrieve Resume Evidence]
                                             v
                             +-------------------------------+
                             |    JobRequirementService      |
                             +---------------+---------------+
                                             |
                                             v
                             +-------------------------------+
                             |        ResumeRetriever        |
                             |  (Vector Store pgvector)      |
                             +-------------------------------+
```

---

## Key Packages & Responsibilities

- **`com.Resume.Ai.controller`**:
  - `ResumeController`: Upload (`POST /api/resumes/upload`), metadata retrieval, updates, and deletion.
  - `ResumeRagController`: Conversational Q&A (`POST /api/resumes/{resumeId}/chat`).
  - `JobDescriptionController`: Job Description CRUD (`POST /api/job-descriptions`, `GET`, `DELETE`).
  - `JobMatchingController`: Resume to Job Description matching (`POST /api/resumes/{resumeId}/match`).
- **`com.Resume.Ai.services`**:
  - `ResumeServiceImpl`: Resume upload orchestration, file storage, Tika text parsing, and indexing delegation.
- **`com.Resume.Ai.indexing`**:
  - `ResumeIndexingService` / `ResumeIndexingServiceImpl`: Decoupled RAG ingestion service that chunks parsed resume text, embeds chunks via `EmbeddingModel`, indexes vectors into `PgVectorStore`, and saves `ResumeChunk` relational entities.
- **`com.Resume.Ai.jobdesc`**:
  - `JobDescriptionNormalizer`: Normalizes whitespace, bullet points, and formatting of job text.
  - `JobRequirementService` / `JobRequirementServiceImpl`: Extracts structured required skills, preferred skills, and responsibilities via Gemini.
  - `JobDescriptionService` / `JobDescriptionServiceImpl`: Manages `JobDescription` persistence and queries.
- **`com.Resume.Ai.matching`**:
  - `JobMatchingService` / `JobMatchingServiceImpl`: Coordinates job matching flow, evidence retrieval from `ResumeRetriever`, Gemini evaluation, deterministic weighted score calculation, and result persistence in `ResumeJobMatch`.
- **`com.Resume.Ai.chunking`**:
  - `ResumeChunker` / `SectionAwareResumeChunker`: Chunks parsed text preserving section boundaries (`SUMMARY`, `SKILLS`, `EXPERIENCE`, `PROJECTS`, `EDUCATION`, `CERTIFICATIONS`).
- **`com.Resume.Ai.vectorstore`**:
  - `ResumeVectorStoreService` / `SpringAiVectorStoreService`: Encapsulates Spring AI `PgVectorStore` operations, enforcing metadata filter `resumeId == '<resumeId>'`.
- **`com.Resume.Ai.rag`**:
  - `ResumeRetriever` / `ResumeRetrieverImpl`: Top-K vector search with similarity threshold (`0.70`).
  - `PromptService` / `PromptServiceImpl`: Builds grounded prompts with prompt injection defenses.
  - `ResumeRagService` / `ResumeRagServiceImpl`: Executes 2-layer security checks, retrieves chunks, and invokes Gemini via `ChatClient`.
- **`com.Resume.Ai.config`**:
  - `RagProperties`: Config for `resume.rag.top-k` and `resume.rag.similarity-threshold`.
  - `JobMatchingProperties`: Config for score weights (`required-skills-weight`, `preferred-skills-weight`, `responsibilities-weight`).
  - `SpringAiConfig`: Autoconfigures Spring AI `ChatClient` builder.
- **`com.Resume.Ai.exception`**:
  - `GlobalExceptionHandler`: Centralized REST error handling for domain and infrastructure exceptions.

---

## Security Model (2-Layer Security)

1. **Layer 1 (Application Authorization)**: Pre-query validation checking `resume.getUserId().equals(authenticatedUserId)` (returns HTTP 403 Forbidden on failure).
2. **Layer 2 (Vector Metadata Isolation)**: Mandatory vector search filter expression `resumeId == requestedResumeId` enforcing zero cross-resume data leakage.

---

## Database Architecture

- **Relational DB**: PostgreSQL (`resumes`, `resume_sections`, `resume_chunks`, `job_descriptions`, `resume_job_match`).
- **Vector DB**: `vector_store` table managed by Spring AI `PgVectorStore` (PostgreSQL + pgvector extension).
- **Metadata**: JSONB containing `resumeId`, `section`, `chunkIndex`.

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
