# Changelog - Interview Service

## [2026-11-21] - Coding Interview Flow, History & Deterministic Scoring Overhaul

### Added
- **History & Detailed Review REST APIs**:
  - `GET /api/interviews/history`: Returns interview history list for authenticated candidate (user identity enforced via `GatewayIdentityHelper.requireCurrentUserId()`).
  - `GET /api/interviews/{id}/detail`: Returns comprehensive question-by-question review, candidate submitted answers/code, and deterministic execution metrics.
- **Database Schema Evolution (`V6__add_coding_language_and_execution_metrics.sql`)**:
  - Added `language` column to `interview_answers`.
  - Added `execution_metrics` (JSONB) column to `answer_evaluations`.
- **Clean Starter Code Initialization**:
  - Updated `CodingProblemDataInitializer` to upsert empty function starter templates (`// TODO: Write your solution here`) across Java, Python, C++, and JavaScript. Solutions completely eradicated from initial code templates.
  - Added `codingStarterTemplates` map to `InterviewQuestionResponse` and `AgentQuestionResponse`.

### Changed
- **Deterministic Coding Evaluation**:
  - Completely removed the deprecated "token-efficient AI review" flow and deleted `CodingEvaluationService.java`.
  - Replaced evaluation logic in `CodingSubmissionService` with deterministic grading based on `OnlineCompilerCodeExecutionService` pass/fail rate, sandbox runtime, and verdict. Zero LLM calls are made for judging code.
- **Dynamic 1 or 2 Question Progression**:
  - Coding submissions now automatically record `followUpDecision = "MOVE_ON"`.
  - Protected `unresolvedFlow` and `mainPreparationStillRunning` in `InterviewSessionService` against non-root coding turns, preventing backend stalling.
  - Added multi-question progression checks in `CodingSubmissionService`: Question 1 submission saves results and advances to Question 2 without prematurely completing the interview or generating the final report.
- **Report Generation**:
  - Enhanced `ReportGenerationService` to calculate and embed deterministic coding statistics (`solvedQuestions`, `testCasesPassed`, `testCasesFailed`, language, execution time, and submitted code) into the final report's `roundBreakdown`.

### Removed
- Removed `CodingEvaluationService.java` and all token-efficient AI review prompt references.
