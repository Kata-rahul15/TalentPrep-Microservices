# Changelog - TalentForgeAI (Frontend)

## [2026-11-23] - Interview Startup Sequencing, Camera Resource Lifecycle, Voice Watchdog & Transcript Print Removal

### Changed
- **Interview Startup Sequencing (`InterviewRoomPage.tsx`)**:
  - Implemented synchronized 4-step startup order: **Greeting → Spoken transition (“Alright, let's get started with your interview.”) → First backend question → Candidate listening**.
  - Protected newly-started interviews from being mistaken for resumed `IN_PROGRESS` sessions using `startedFromDeviceSetupRef` when backend status changes before the greeting finishes speaking.
  - Staged first backend question (`firstQuestionStaged`) arriving from WebSocket (`INTERVIEW_STARTED`) or REST reconciliation (`reconcileSessionFromRest`) so it cannot bypass the greeting or spoken transition.
  - Suppressed candidate microphone auto-listening during the greeting and spoken transition window.
- **Camera Lifecycle & Resource Management (`InterviewRoomPage.tsx`, `InterviewDeviceSetup.tsx`)**:
  - Camera-off stops active video tracks (`MediaStreamTrack.stop()`), removes video tracks from the stream, detaches preview, and updates stream references to an audio-only stream where audio remains available.
  - Camera-on obtains a fresh video track via `navigator.mediaDevices.getUserMedia` and combines it with existing audio tracks into a new `MediaStream`.
  - Intended to release webcam hardware capture resources; physical laptop camera LED indicator extinguishing is hardware-, firmware-, and OS-dependent and remains manually unverified.
- **Voice Synthesis & Recognition Reliability (`useSpeechSynthesis.ts`, `useSpeechRecognition.ts`)**:
  - Cancelled or replaced utterance completion/error callbacks are guarded (`activeUtteranceRef.current === utterance`), preventing cancellation from accidentally triggering end-of-speech flows or starting speech recognition.
  - Added speech watchdog fallback timer to advance the FIFO speech queue and cancel stalled utterances even if the browser remains stuck reporting `speechSynthesis.speaking`.
  - Documented browser speech synthesis voice availability variability across operating systems and browsers.
  - Documented Web Speech API speech recognition interim/final streaming, non-duplicating accumulation refs, explicit recording intent auto-restart, error classifications, typing fallback, and browser/network limitations.
- **Verification & Test Coverage**:
  - Verified with 25 passing mock tests in `videoInterviewRoom.test.mjs` (16 tests) and `voiceInterview.test.mjs` (9 tests).
  - Note: Automated tests use mock/simulated browser APIs; physical webcam hardware LED status, live browser STT transcription, and live browser TTS audio output remain manually unverified.

### Removed
- **Interview Transcript Print Action (`InterviewTranscriptPage.tsx`)**:
  - Removed "Print Transcript" button (`window.print()`) from the interview transcript header. Interview transcript reviews are conducted directly in-app.
  - Resume PDF download, template export (via `jspdf` / `html2canvas`), and resume printing functionality remain completely unchanged and in scope.

## [2026-11-21] - Interview Selection UI: Remove Misleading Job Role Titles

### Changed
- **Curated Practice Tracks Redesign (`InterviewLandingPage.tsx`)**:
  - Removed misleading job titles (`Full Stack Developer`, `Backend Engineer`, `Software Engineer`, `Senior Software Engineer`).
  - Set interview categories as primary card headings: **Technical Interview**, **System Design**, **Coding Round**, and **HR Interview**.
  - Replaced role-specific descriptions with round-focused descriptions accurately describing each interview type.
  - Replaced hardcoded stack tags (`React / TypeScript`, `Spring Boot / Node`, `PostgreSQL`, `Kafka`, etc.) with generic category tags.
  - Decoupled interview type from job role: Launch Track forwards round type, duration, and difficulty without overriding candidate's resume target role (`setupData?.targetRole`), preserving resume-based personalization.

## [2026-11-21] - Coding Interview Flow, History & Deterministic Reporting Overhaul

### Added
- **Interview History Section (`InterviewLandingPage.tsx`)**:
  - Displays authenticated user's past interviews fetched from `GET /api/interviews/history` via `useInterviewHistory()`.
  - Implements TalentPrep design system (`#2563EB` primary blue, `#FAFAFA` background, white cards, `#111827` text, `#E5E7EB` borders, green/orange/red status badges).
  - Shows interview type, date/time, score, question count, duration, and action buttons ("Review", "Report", "Resume").
- **Interview Review Page (`InterviewReviewPage.tsx`)**:
  - Registered route `/interview/:sessionId/review`.
  - For Coding interviews: Reuses `CodingInterviewWorkspace` in `readOnly` mode (Monaco editor locked, submitted code loaded, language selected, bottom panel showing persisted test results). Includes question switcher tabs for multi-question interviews with zero re-execution or extra network requests.
  - For Non-Coding interviews (Technical, Behavioral, System Design): Clean review layout with question prompts, submitted answers, dimension scores, feedback, strengths, and areas for improvement.
- **Detailed Coding Scorecard in Report (`InterviewReportPage.tsx`)**:
  - Displays deterministic execution metrics: total questions, attempted, solved, test cases passed/failed, per-question breakdown showing candidate's submitted code, language, runtime, and deterministic evaluation feedback.

### Changed
- **`CodingInterviewWorkspace.tsx`**:
  - Pre-filled solutions completely eradicated. Starter code is cleanly initialized from `question.codingStarterTemplates` (empty function signature with `// TODO: Write your solution here`).
  - Added `readOnly`, `initialLanguage`, `persistedScore`, and `persistedMetrics` props for review mode.
  - Changed submission button from "Submit Code for AI Review" to "Submit Code".
  - Sub-tab "AI Review Checklist" completely removed.
- **`InterviewRoomPage.tsx`**:
  - Connected live session state and controls to `CodingInterviewWorkspace`.
  - Supports dynamic progression between Question 1 and Question 2 without stalling or premature report generation.
- **`EvaluationFeedbackModal.tsx`**:
  - Shows deterministic execution metrics banner (`passedCount / totalCount`, `verdict`, runtime ms) on coding submissions.

### Removed
- **Report Downloads Everywhere**:
  - Removed "Print Report" button (`window.print()`) and PDF download handlers across interview reports and workspaces. Reports are presented directly inside TalentPrep.
