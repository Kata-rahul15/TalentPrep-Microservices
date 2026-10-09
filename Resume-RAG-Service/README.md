# TalentPrep Resume-RAG-Service

The **Resume-RAG-Service** is the resume intelligence and career-support microservice in TalentPrep. It accepts resumes, extracts and analyzes their content, persists structured profile data, indexes resume content for retrieval, and exposes APIs for resume management, job matching, job discovery, resume building, and the AI career/resume agent.


## Contents

- [Responsibilities](#responsibilities)
- [Architecture](#architecture)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Design Principles](#Design-Principles)
- [API overview](#api-overview)
- [Database and storage](#database-and-storage)

## Responsibilities

This service owns resume-specific and career-support workflows:

- Resume upload, parsing, analysis, retrieval, and download.
- Structured resume profile and analysis persistence.
- Resume chunking and vector indexing for RAG.
- ATS evaluation and job-description matching.
- Resume builder and version history.
- Job discovery using SerpAPI's Google Jobs engine.
- Redis caching for job-search and job-detail lookups.
- AI agent tools for resume knowledge and job discovery.

Authentication and request routing belong to the surrounding TalentPrep microservices architecture. In the monorepo, this service is intended to be called through the API Gateway rather than exposed directly to the public internet.

## Architecture — Resume-RAG-Service

The Resume-RAG-Service is the AI-powered resume intelligence component of TalentPrep. It combines resume parsing, LLM-based analysis, vector search, personalized job discovery, and resume-building capabilities in a Spring Boot microservice.

### High-Level Architecture

```text
                    TALENTPREP FRONTEND
                            |
                            v
                   API GATEWAY (:8080)
                            |
                            v
                RESUME-RAG-SERVICE (:8082)
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
    RESUME PROCESSING   AI CAREER AGENT    JOB SEARCH
          |                 |                  |
          v                 v                  v
     Apache Tika       Resume Profile      Target Roles
   Text Extraction     + RAG Retrieval     from Database
          |                 |                  |
          v                 v                  v
     LLM ANALYSIS      Agent Tools         SerpAPI
          |            /         \         Google Jobs
          v           v           v             |
   Structured       Resume      Job Search      |
   Resume Profile   Knowledge     Service        |
          |             |           |            |
          +-------------+-----------+------------+
                        |
             +----------+-----------+
             |                      |
             v                      v
      SUPABASE POSTGRESQL         REDIS
             |                      |
             v                      v
       Resume Metadata        Cached Job Search
       Resume Sections       & Job Detail Results
       Target Roles
       ATS Evaluations
       Job Matches
       Resume Versions

          RESUME INDEXING & RETRIEVAL
                        |
                        v
                 Text Chunking
                        |
                        v
              Gemini Embeddings
                        |
                        v
                 PGVECTOR STORE
                        |
                        v
              Semantic RAG Retrieval


       OTHER RESUME-SERVICE CAPABILITIES
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      ATS Analysis  Resume Builder  Version History
          |             |             |
          +-------------+-------------+
                        |
                        v
               Personalized Results
                 to the Frontend
```


## Features

### Resume management
- Upload and validate resume documents.
- Extract text using Apache Tika.
- Track resume processing status.
- Retrieve resume details, overview, profile, and ATS analysis.
- Download a stored resume.
- Delete a resume through the resume API.

### AI analysis and retrieval
- Structured resume analysis.
- Resume chunking and embedding generation.
- Vector retrieval through pgvector.
- Resume-grounded RAG / knowledge retrieval for the agent and supported workflows.

### Job discovery and matching
- Google Jobs search through SerpAPI.
- Redis caching for searches and job details.
- Resume-backed target-role search.
- Job-description creation and retrieval.
- Resume-to-job matching and evaluation.
- Matched and missing skill information where provided by the matching response.

### Resume builder
- Generate and update resume content through the builder API.
- Save resume versions.
- List versions and restore a previous version.

### AI career/resume agent
- Agent chat endpoint and message persistence.
- Tools for accessing resume profile/knowledge and job discovery.
- `findJobsForMe` tool for target-role-driven job search.

## Technology stack

| Area | Technology / integration |
|---|---|
| Backend | Java, Spring Boot |
| API routing | Spring MVC controllers; deployed behind Spring Cloud Gateway |
| Resume extraction | Apache Tika |
| AI orchestration | Spring AI `ChatClient` |
| Resume analysis | Dedicated Groq-compatible API configuration; default model configured as `openai/gpt-oss-120b` |
| Agent / general chat | OpenAI-compatible Spring AI model configuration pointing to Groq; default model configured as `qwen/qwen3.8-27b` |
| Embeddings | Google Gemini embedding API; model and dimensions configurable |
| Relational persistence | PostgreSQL via Spring Data JPA / Hibernate |
| Vector search | pgvector through Spring AI's `VectorStore` integration |
| Search provider | SerpAPI Google Jobs engine |
| Search cache | Redis |
| File storage | Configurable local or Supabase-backed storage implementations |
| Configuration | Spring YAML and environment variables |


### Design Principles

- **Separation of concerns:** Resume processing, retrieval, job search, and resume building are separate responsibilities within the service.
- **Resume-grounded recommendations:** Job searches use target roles derived from the candidate's stored resume profile.
- **Reusable retrieval:** Cached job-search results reduce repeated provider calls.
- **Retrieval-augmented generation:** Resume chunks provide contextual evidence to supported AI workflows.
- **Persistent state:** PostgreSQL stores structured resume data, while pgvector supports semantic retrieval and Redis accelerates repeated searches.


## API overview

The following routes are visible in the supplied source. Exact request/response schemas are defined by the controller DTOs.

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/resumes/upload` | Upload a resume (`multipart/form-data`) |
| `GET` | `/api/resumes/me` | Retrieve current user's resume |
| `GET` | `/api/resumes/{resumeId}` | Retrieve a resume |
| `GET` | `/api/resumes/details` | Retrieve resume details |
| `GET` | `/api/resumes/{resumeId}/details` | Retrieve details for a resume |
| `GET` | `/api/resumes/overview` | Retrieve resume overview |
| `GET` | `/api/resumes/{resumeId}/overview` | Retrieve overview for a resume |
| `GET` | `/api/resumes/ats-analysis` | Retrieve ATS analysis |
| `GET` | `/api/resumes/{resumeId}/ats-analysis` | Retrieve ATS analysis for a resume |
| `GET` | `/api/resumes/{resumeId}/profile` | Retrieve a structured resume profile |
| `GET` | `/api/resumes/{resumeId}/download` | Download a resume |
| `DELETE` | `/api/resumes/{resumeId}` | Delete a resume |
| `GET` | `/api/resumes/jobs/search` | Search jobs by query |
| `GET` | `/api/resumes/jobs/for-me` | Search jobs using stored target roles |
| `POST` | `/api/resumes/{resumeId}/match` | Match a resume to a job description / requirements |
| `GET` | `/api/resumes/{resumeId}/match/{matchId}` | Retrieve a job-match result |
| `POST` | `/api/job-descriptions` | Create a job description |
| `GET` | `/api/job-descriptions/{id}` | Retrieve a job description |
| `GET` | `/api/job-descriptions/me` | List current user's job descriptions |
| `DELETE` | `/api/job-descriptions/{id}` | Delete a job description |
| `POST` | `/api/resumes/builder` | Create/generate builder content |
| `GET` | `/api/resumes/{resumeId}/builder` | Retrieve builder content |
| `PUT` | `/api/resumes/{resumeId}/builder` | Update builder content |
| `POST` | `/api/resumes/{resumeId}/versions` | Save a resume version |
| `GET` | `/api/resumes/{resumeId}/versions` | List resume versions |
| `POST` | `/api/resumes/{resumeId}/versions/{versionId}/restore` | Restore a saved version |


The service also has local and production YAML profiles and storage configuration classes. Review those files in the complete project for any additional profile-specific variables. Keep embedding dimensions consistent with the existing pgvector column and all stored vectors; changing the dimension requires a planned migration/reindex.

## Database and storage

### PostgreSQL / Supabase

The service uses PostgreSQL for resume metadata and structured records, including resume sections, job descriptions, evaluations, matches, and versions.

### pgvector

Resume content is chunked and embedded for similarity retrieval. The embedding model, dimensions, and retrieval settings are configured through YAML/environment variables. Existing vector columns and indexes must match the embedding dimension in use.

### File storage

 local and Supabase storage implementations. Configured the intended storage backend explicitly for each environment and ensure downloaded-file ownership checks are enforced.

