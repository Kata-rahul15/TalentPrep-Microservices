# 🧠 TalentPrep Resume-RAG-Service

An AI-powered Resume Intelligence and Career Assistance microservice built with **Java, Spring Boot, Spring AI, PostgreSQL, pgvector, Redis, Apache Tika, Gemini Embeddings, and SerpAPI**.

This service powers TalentPrep's resume processing, AI resume analysis, retrieval-augmented generation (RAG), personalized job discovery, ATS evaluation, job matching, resume building, and AI Career Agent.

It combines structured resume analysis with vector-based retrieval and cached job search to deliver resume-aware career assistance.

---

# 🚀 Features

## 📄 Resume Management

- Resume Upload
- Resume Text Extraction using Apache Tika
- Resume Processing Status Tracking
- Structured Resume Profile
- Resume Overview and Details
- Resume Download and Deletion
- Asynchronous Resume Processing

---

## 🤖 AI Resume Analysis

- LLM-Based Resume Analysis
- Professional Summary Extraction
- Skills and Technology Identification
- Education and Experience Extraction
- Project and Certification Analysis
- Structured Resume Profile Generation
- Resume Evaluation and Insights

### Target Role Identification

During resume analysis, the LLM identifies up to two suitable target roles based on the candidate's resume evidence.

- Target Role Generation During Resume Analysis
- Role Selection Based on Skills, Projects, Experience, and Certifications
- Target Role Persistence in PostgreSQL
- Reuse of Stored Target Roles During Job Search
- Support for Existing Resumes Without Stored Target Roles

---

## 🔎 Retrieval-Augmented Generation (RAG)

- Resume Text Chunking
- Embedding Generation using Google Gemini
- Vector Storage using pgvector
- Semantic Similarity Search
- Resume-Grounded Context Retrieval
- Retrieval Tools for the AI Career/Resume Agent

RAG allows supported AI workflows to retrieve relevant resume information instead of relying only on general model knowledge.

---

## 💼 AI Find Jobs for Me

Personalized job discovery based on the user's stored resume profile and target roles.

- Resume-Backed Job Search
- Target-Role-Based Search Queries
- Multiple Role Searches
- Google Jobs Retrieval through SerpAPI
- Result Merging and Deduplication
- Redis-Backed Search Caching
- Job Detail Caching
- Manual Job Search Support

### Job Search Flow

1. Retrieve the authenticated user's active resume.
2. Load its stored target roles.
3. Search each target role using SerpAPI.
4. Retrieve cached results from Redis when available.
5. Cache provider results after successful cache misses.
6. Merge and deduplicate results.
7. Return job recommendations to the frontend.

---

## 📊 ATS Analysis and Job Matching

- Resume ATS Evaluation
- Job Description Management
- Resume-to-Job Matching
- Skill Match and Gap Information
- Match Result Retrieval
- Job-Specific Resume Evaluation

---

## 📝 AI Resume Builder

- Resume Content Generation
- Resume Content Updates
- Builder Data Persistence
- Resume Version Creation
- Version History Retrieval
- Previous Version Restoration

---

## 💬 AI Career/Resume Agent

- AI Agent Chat
- Resume Profile Access
- Resume Knowledge Retrieval
- Job Search Tool Integration
- Resume-Grounded Assistance
- Agent Message Persistence

The agent can use backend tools to access resume information and perform supported career workflows.

---

# 🏗️ Architecture

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
   RESUME PROCESSING    AI CAREER AGENT    JOB SEARCH
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
      SUPABASE POSTGRESQL          REDIS
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
                        |
                        v
               Personalized Results
                 to the Frontend
```

---

# 🔄 Resume Processing Flow

```text
User Uploads Resume
        |
        v
Validate Uploaded File
        |
        v
Apache Tika Text Extraction
        |
        v
Normalize Extracted Text
        |
        v
LLM Resume Analysis
        |
        +----------------------------+
        |                            |
        v                            v
Structured Resume Profile     Target Role Generation
        |                            |
        +-------------+--------------+
                      |
                      v
              Persist in PostgreSQL
                      |
                      v
                Text Chunking
                      |
                      v
               Gemini Embeddings
                      |
                      v
                pgvector Indexing
                      |
                      v
               Resume Status: READY
```

---

# 🔍 AI Find Jobs for Me Flow

```text
User Clicks AI Find Jobs For Me
              |
              v
GET /api/resumes/jobs/for-me
              |
              v
Resolve Authenticated User
              |
              v
Load Active Resume Profile
              |
              v
Retrieve Stored Target Roles
              |
              v
Search Each Target Role
              |
              v
        Redis Cache Check
              |
        +-----+-----+
        |           |
        v           v
     Cache HIT   Cache MISS
        |           |
        |           v
        |        SerpAPI
        |      Google Jobs
        |           |
        |           v
        |       Cache Results
        |           |
        +-----+-----+
              |
              v
     Merge and Deduplicate
              |
              v
      Return Job Results
```

---

# 🗄️ Database and Caching

## PostgreSQL / Supabase

Stores persistent application data, including:

- Resume Metadata
- Structured Resume Sections
- Stored Target Roles
- ATS Analysis
- Job Descriptions
- Resume Job Matches
- Resume Evaluations
- Resume Versions
- AI Agent Messages and Chat History

Target roles are stored with resume data so the job-search service can reuse them without running another LLM analysis on every search.

## pgvector

Used for vector-based resume retrieval.

- Stores resume embeddings and associated metadata.
- Supports semantic similarity search.
- Provides relevant resume context to supported RAG workflows.

## Redis

Used as the caching layer for job-search operations.

- Job Search Result Caching
- Job Detail Caching
- Configurable Cache Expiration
- Reduced Repeated SerpAPI Requests

PostgreSQL remains the source of truth for resume profiles and target roles. Redis improves retrieval performance, while pgvector supports semantic search.

---

# 🛠️ Tech Stack

- Java
- Spring Boot
- Spring AI
- Spring Data JPA
- Hibernate
- Apache Tika
- PostgreSQL / Supabase
- pgvector
- Redis
- Google Gemini Embeddings
- Configured LLM APIs through OpenAI-compatible integrations
- SerpAPI — Google Jobs
- Maven
- REST APIs
- Spring Cloud API Gateway

---

# 📌 REST API

The following routes are documented by the supplied service source. Confirm exact request and response DTOs in the controllers.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resumes/upload` | Upload a resume |
| `GET` | `/api/resumes/me` | Retrieve the current user's resume |
| `GET` | `/api/resumes/{resumeId}` | Retrieve resume information |
| `GET` | `/api/resumes/{resumeId}/profile` | Retrieve the structured resume profile |
| `GET` | `/api/resumes/overview` | Retrieve resume overview |
| `GET` | `/api/resumes/ats-analysis` | Retrieve ATS analysis |
| `GET` | `/api/resumes/{resumeId}/download` | Download a resume |
| `DELETE` | `/api/resumes/{resumeId}` | Delete a resume |
| `GET` | `/api/resumes/jobs/search` | Search jobs by query |
| `GET` | `/api/resumes/jobs/for-me` | Search jobs using stored target roles |
| `POST` | `/api/resumes/{resumeId}/match` | Match a resume against job requirements |
| `GET` | `/api/resumes/{resumeId}/match/{matchId}` | Retrieve a job-match result |
| `POST` | `/api/job-descriptions` | Create a job description |
| `GET` | `/api/job-descriptions/me` | List the current user's job descriptions |
| `GET` | `/api/job-descriptions/{id}` | Retrieve a job description |
| `DELETE` | `/api/job-descriptions/{id}` | Delete a job description |
| `POST` | `/api/resumes/builder` | Generate resume-builder content |
| `GET` | `/api/resumes/{resumeId}/builder` | Retrieve builder content |
| `PUT` | `/api/resumes/{resumeId}/builder` | Update builder content |
| `POST` | `/api/resumes/{resumeId}/versions` | Save a resume version |
| `GET` | `/api/resumes/{resumeId}/versions` | List resume versions |
| `POST` | `/api/resumes/{resumeId}/versions/{versionId}/restore` | Restore a resume version |

---

# 🔐 Security and Integration

- Designed to operate behind the TalentPrep API Gateway.
- Uses authenticated user identity for user-specific resume operations.
- Requires ownership checks for resume-specific data access.
- Keeps database credentials and external API keys in environment configuration.
- Separates persistent resume data from temporary search caching.

The gateway must provide trusted identity information for personalized endpoints. Identity headers must not be accepted directly from an untrusted browser without validation.

---

# ⚙️ Configuration

Configure the following environment variables according to your deployment:

| Variable | Purpose |
|---|---|
| `DB_URL` | PostgreSQL JDBC URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `GROQ_API_KEY` | Configured LLM API key |
| `GEMINI_API_KEY` | Gemini embedding API key |
| `SERPAPI_API_KEY` | SerpAPI key |
| `redis_host` | Redis host |
| `redis_port` | Redis port |
| `redis_username` | Redis username, if required |
| `redis_password` | Redis password, if required |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile |

Use the complete project's `application.yml` and profile-specific YAML files to verify additional variables and configured defaults. Never commit production secrets.

---

# 🚀 Running and Validation

From the complete Resume-RAG-Service Maven project root:

```bash
mvn test
mvn package
```

Before deployment:

1. Configure PostgreSQL, Redis, and AI provider credentials.
2. Apply the target-role database migration if it has not already been applied.
3. Verify pgvector dimensions match the configured embedding model.
4. Confirm the API Gateway forwards trusted user identity.
5. Test resume upload through processing completion.
6. Verify that target roles are saved with the correct resume.
7. Test `/api/resumes/jobs/for-me` with different resumes.
8. Verify Redis cache hits and misses.
9. Test RAG retrieval, ATS matching, builder, version history, and downloads.

---

# 💡 What This Project Demonstrates

- AI-Powered Resume Processing
- LLM-Based Structured Information Extraction
- Retrieval-Augmented Generation
- Vector Search with pgvector
- Semantic Embeddings
- Resume-Driven Job Discovery
- Redis Caching
- Third-Party Search API Integration
- Resume-to-Job Matching
- REST API Design
- Spring Boot Microservice Architecture
- Persistent AI Workflows

---

## ⭐ If you find TalentPrep useful, consider giving the repository a star!
