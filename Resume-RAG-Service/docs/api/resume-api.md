# Resume API Contract

**Service**: Resume AI Backend  
**Base URL**: `http://localhost:8080`  
**Version**: 1.0 (Stage 1 — File Upload & Processing)  
**Date**: 2026-08-12

> **Authentication**: This service sits behind an API Gateway.  
> All requests must include an `X-User-Id` header set by the gateway.  
> This service performs **no JWT validation** — it trusts the header value.

---

## Error Response Shape

All error responses follow this consistent structure:

```json
{
  "timestamp": "2026-08-12T18:00:00.000",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable description safe for frontend display"
}
```

---

## Endpoints

---

### 1. Upload Resume

**Upload and process a resume file. The file is stored, parsed, and text is extracted automatically.**

```
POST /api/resumes/upload
Content-Type: multipart/form-data
X-User-Id: <uuid>              ← Injected by API Gateway
```

#### Request Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | `multipart/form-data` part | ✅ | The resume file (PDF or DOCX) |
| `resumeName` | `String` (form field) | ✅ | Human-readable label (e.g. "Google SWE Resume") |

#### Headers

| Header | Required | Description |
|---|---|---|
| `X-User-Id` | ✅ | UUID of the authenticated user. Set by API Gateway. |
| `Content-Type` | ✅ | Must be `multipart/form-data` |

#### Validation Rules

| Rule | Details |
|---|---|
| File must not be null or empty | HTTP 400 |
| Allowed file types | PDF (`.pdf`), DOCX (`.docx`) only |
| MIME type sniffing | Apache Tika reads actual bytes — renaming a `.html` to `.pdf` is detected and rejected |
| Maximum file size | 10 MB (configurable via `resume.validation.max-file-size-bytes`) |
| Filename max length | 255 characters |
| `resumeName` must not be blank | HTTP 400 |

#### Successful Response — `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "resumeName": "Google SWE Resume",
  "originalFilename": "my_resume_2024.pdf",
  "fileSize": 204800,
  "mimeType": "application/pdf",
  "status": "READY",
  "version": 1,
  "active": true,
  "createdAt": "2026-08-12T18:00:00",
  "updatedAt": "2026-08-12T18:00:01"
}
```

#### Status Field Values

| Value | Meaning |
|---|---|
| `UPLOADING` | File write in progress |
| `PROCESSING` | Text extraction in progress |
| `READY` | File stored and text extracted successfully |
| `FAILED` | Storage or parsing failed. Record still exists. |

#### Error Responses

| Status | Error | Cause |
|---|---|---|
| `400 Bad Request` | `InvalidResumeFileException` | File is null, empty, too large, or `resumeName` is blank |
| `415 Unsupported Media Type` | `UnsupportedResumeFormatException` | File type is not PDF or DOCX |
| `413 Payload Too Large` | `MaxUploadSizeExceededException` | File exceeds Spring's multipart limit (10 MB) |
| `422 Unprocessable Entity` | `ResumeParsingException` | File is corrupt, password-protected, or has no extractable text |
| `500 Internal Server Error` | `ResumeStorageException` | Filesystem write failure |

#### Example cURL

```bash
curl -X POST http://localhost:8080/api/resumes/upload \
  -H "X-User-Id: a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -F "resumeName=Google SWE Resume" \
  -F "file=@/path/to/resume.pdf"
```

---

### 2. Get Resume

**Retrieve the full details of a single resume by its ID.**

```
GET /api/resumes/{resumeId}
X-User-Id: <uuid>
```

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `resumeId` | UUID | The resume's unique identifier |

#### Successful Response — `200 OK`

Same shape as the upload response.

#### Error Responses

| Status | Cause |
|---|---|
| `404 Not Found` | No resume found with the given ID |
| `400 Bad Request` | `resumeId` is not a valid UUID |

#### Example cURL

```bash
curl http://localhost:8080/api/resumes/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-User-Id: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

---

### 3. Get User's Resumes

**Retrieve a summary list of all resumes belonging to a user.**

```
GET /api/resumes/user/{userId}
X-User-Id: <uuid>
```

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `userId` | UUID | The user whose resumes to retrieve |

#### Successful Response — `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "resumeName": "Google SWE Resume",
    "status": "READY",
    "createdAt": "2026-08-12T18:00:00"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "resumeName": "Amazon PM Resume",
    "status": "READY",
    "createdAt": "2026-08-11T10:00:00"
  }
]
```

Returns an empty array `[]` if no resumes exist (not 404).

---

### 4. Update Resume

**Update a resume's name and/or active status. Does not re-process the file.**

```
PATCH /api/resumes/{resumeId}
Content-Type: application/json
X-User-Id: <uuid>
```

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `resumeId` | UUID | The resume to update |

#### Request Body

```json
{
  "resumeName": "Updated Resume Name",
  "active": false
}
```

All fields are optional. Only provided fields are updated.

#### Successful Response — `200 OK`

Full `ResumeResponse` with updated fields.

#### Error Responses

| Status | Cause |
|---|---|
| `404 Not Found` | Resume not found |

---

### 5. Delete Resume

**Permanently deletes the resume record and its stored file.**

```
DELETE /api/resumes/{resumeId}
X-User-Id: <uuid>
```

#### Successful Response — `204 No Content`

Empty body.

#### Notes

- If the physical file cannot be deleted (e.g. already missing from disk), the database record is still deleted and a `WARN` log is emitted.
- This action is **irreversible**.

#### Error Responses

| Status | Cause |
|---|---|
| `404 Not Found` | Resume not found |

---

## Configuration Reference

```yaml
# application.yml

resume:
  storage:
    type: local              # Switch to: s3 | r2 | gdrive (requires new bean)
    base-path: ./uploads/resumes

  validation:
    max-file-size-bytes: 10485760   # 10 MB
    allowed-mime-types:
      - application/pdf
      - application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

---

## Stored File Path Convention

Files are stored at:

```
{base-path}/{resumeId}/{sanitised-original-filename}
```

Example:

```
./uploads/resumes/550e8400-e29b-41d4-a716-446655440000/my_resume_2024.pdf
```

The `storagePath` column in the database stores only the **relative** path (`{resumeId}/{filename}`) — never an absolute filesystem path.

---

## Replacing Local Storage with S3 (Future)

1. Create `S3FileStorageService implements FileStorageService`
2. Annotate with `@ConditionalOnProperty(name = "resume.storage.type", havingValue = "s3")`
3. Change `resume.storage.type=s3` in `application.yml`
4. **Zero changes** to `ResumeServiceImpl`, `ResumeController`, or any other class.

---

## Notes for Frontend Developers

- The `status` field tells you whether the resume is ready for AI features:
  - Only resumes with `status: READY` have extracted text available.
  - Resumes with `status: FAILED` were saved to the database but parsing failed. They can be re-uploaded.
- `storedFilename` and `storagePath` are **not** returned in any API response — these are internal implementation details.
- For listing resumes, prefer `GET /api/resumes/user/{userId}` (lightweight summary) over calling `GET /api/resumes/{id}` multiple times.
