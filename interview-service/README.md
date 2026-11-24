# TalentPrep Interview Service

Hybrid REST + STOMP/WebSocket interview service supporting Technical, System Design, HR, and **Coding Interviews** powered by **OnlineCompiler.io**.

See `PROJECT_CONTEXT.md`, `WEBSOCKET_FRONTEND_INTEGRATION.md`, and `SECURITY_ARCHITECTURE.md`.

---

## 🛠️ Configuration & Environment Variables

Create a `.env` file or export the following environment variables:

| Variable | Description | Default / Example |
|---|---|---|
| `INTERVIEW_TO_RESUME_INTERNAL_TOKEN` | Internal secret shared with `resume-service` | Required |
| `RESUME_SERVICE_URL` | Base URL for `resume-service` | `http://localhost:8082` |
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/talentprep_interviews` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `GROQ_API_KEY` | Spring AI Groq API key for interview questions/evaluation | Required for AI feedback |
| `CODE_EXECUTION_PROVIDER` | Code execution engine | `onlinecompiler` |
| `CODE_EXECUTION_BASE_URL` | OnlineCompiler.io API base URL | `https://api.onlinecompiler.io` |
| `CODE_EXECUTION_API_KEY` | **OnlineCompiler.io API Key** | Get from [onlinecompiler.io](https://onlinecompiler.io/) |

> [!IMPORTANT]
> **API Key Security**: `CODE_EXECUTION_API_KEY` must **never** be checked into version control, passed to the frontend, or logged in server logs. All code execution requests are proxied securely through the backend.

---

## 💻 OnlineCompiler.io Integration

The coding interview features real, sandboxed code execution and deterministic autograding:

- **Run Code**: Executes visible sample test cases synchronously via `POST /api/run-code-sync/` or `POST /api/run-tests/`.
- **Submit Code**: Evaluates code deterministically against **both visible and confidential hidden test cases** via `POST /api/run-tests/`.
  - Hidden test inputs and expected outputs are **never sent to the frontend**.
  - Pass/fail verdicts and accuracy scores are 100% deterministic (from the sandbox compiler exit codes and diff comparisons, not LLMs).
- **Post-Submission AI Code Review**: Once execution completes, Spring AI evaluates the submission for Big-O time & space complexity, code readability, strengths, and optimizations.

### Supported Compilers & Languages

| Language | OnlineCompiler Identifier | Version | Default Starter |
|---|---|---|---|
| Java | `openjdk-25` | OpenJDK 25 | Standard I/O + Solution class |
| Python | `python-3.14` | Python 3.14 | `sys.stdin` driver + Solution |
| C++ | `g++-15` | GCC 15 | `std::cin` driver + Solution |
| JavaScript | `nodejs-24` | Node.js 24 | `fs.readFileSync(0)` driver |
| TypeScript | `typescript-deno` | Deno TypeScript | Standard I/O driver |

---

## 🚀 Running & Testing

Build and run tests:

```bash
./mvnw clean test
```

Run live integration test with an actual OnlineCompiler.io API key:

```bash
CODE_EXECUTION_API_KEY="your-real-key" ./mvnw test -Dtest="OnlineCompilerLiveIntegrationTest"
```

Start the service locally on port 8083:

```bash
./mvnw spring-boot:run
```
