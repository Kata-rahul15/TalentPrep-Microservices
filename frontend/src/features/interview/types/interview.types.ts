// ─────────────────────────────────────────────────────────────
// TalentPrep Interview Service — TypeScript Interfaces & DTOs
// Matches backend com.talentprep.interview.dto / entity.enums
// ─────────────────────────────────────────────────────────────

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'

export type InterviewMode = 'TEXT' | 'VOICE'

export type InterviewInteractionMode = 'CHAT' | 'VOICE'

export type RoundType =
  | 'TECHNICAL'
  | 'CODING'
  | 'PROJECT'
  | 'SYSTEM_DESIGN'
  | 'BEHAVIORAL'

export type InterviewStatus =
  | 'CREATED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'ROUND_TRANSITION'
  | 'COMPLETED'
  | 'REPORT_GENERATED'

export type RoundStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type QuestionStatus = 'PENDING' | 'ANSWERED' | 'SKIPPED'

export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE' | 'UNLIMITED'

export type TranscriptionStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

// ─── Setup & Resume Context DTOs ─────────────────────────────

export interface ProjectContextDto {
  name: string
  description: string
  technologies: string[]
  highlights: string[]
}

export interface ExperienceContextDto {
  company: string
  role: string
  duration: string
  responsibilities: string[]
  achievements: string[]
  technologies: string[]
}

export interface CandidateSetupDetailsResponse {
  resumeId: string | null
  resumeAvailable: boolean
  candidateName: string | null
  targetRole: string | null
  availableTargetRoles?: string[]
  experienceLevel: string | null
  skills: string[]
  projects: ProjectContextDto[]
  experience: ExperienceContextDto[]
  certifications?: string[]
  availableSessionsRemaining: number
  planType: string
  unlimitedAccess: boolean
}

// ─── Session DTOs ────────────────────────────────────────────

export interface CreateInterviewRequest {
  resumeId?: string
  difficulty: DifficultyLevel
  mode: InterviewMode
  rounds: RoundType[]
  targetRole?: string
  targetJobDescription?: string
  durationMinutes?: number
  idempotencyKey?: string
}

export interface InterviewRoundResponse {
  id: string
  roundOrder: number
  roundType: RoundType
  status: RoundStatus
  targetQuestionCount: number
  completedQuestionCount: number
  roundScore: number | null
}

export interface InterviewSessionResponse {
  id: string
  userId: string
  resumeId: string | null
  status: InterviewStatus
  difficulty: DifficultyLevel
  mode: InterviewMode
  targetRole: string | null
  durationMinutes: number
  currentRoundIndex: number
  totalRounds: number
  rounds: InterviewRoundResponse[]
  createdAt?: string
  startedAt?: string | null
  completedAt?: string | null
  pausedAt?: string | null
  totalPausedSeconds?: number
  remainingSeconds?: number | null
  endsAt?: string | null
}

// ─── Question DTOs ───────────────────────────────────────────

export interface CodingTestCaseDto {
  input: string
  expectedOutput: string
  description?: string
}

export interface InterviewQuestionResponse {
  questionId: string
  roundId: string
  sessionId: string
  roundOrder: number
  roundType: RoundType
  questionOrder: number
  targetQuestionCount: number
  questionText: string
  questionCategory: string | null
  difficulty: DifficultyLevel
  isFollowUp: boolean
  depth?: number
  topic?: string | null
  parentQuestionId?: string | null
  questionStatus: QuestionStatus
  codingBoilerplate: string | null
  codingTestCases: CodingTestCaseDto[]
}

// ─── Answer & Evaluation DTOs ────────────────────────────────

export interface SubmitAnswerRequest {
  questionId: string
  answerText: string
  timeTakenSeconds?: number
  clientRequestId?: string
}

export interface AnswerAcceptedResponse {
  answerId: string
  status: string
  sessionId: string
  clientRequestId?: string
}

export interface CurrentInterviewStateResponse {
  sessionId: string
  status: InterviewStatus
  currentRoundIndex: number
  turnSequence: number
  currentQuestion: InterviewQuestionResponse | null
  remainingSeconds: number | null
  completed: boolean
}

export interface AnswerEvaluationResponseDto {
  evaluationId: string
  questionId: string
  score: number // 0 - 100
  technicalAccuracy: number // 0 - 100
  completeness: number // 0 - 100
  clarity: number // 0 - 100
  problemSolving: number // 0 - 100
  feedback: string
  strengths: string[]
  improvements: string[]
  suggestedIdealAnswer: string
  roundCompleted: boolean
  interviewCompleted: boolean
  currentRoundIndex: number
}

// ─── Coding DTOs ─────────────────────────────────────────────

export interface CodeSubmissionRequest {
  questionId: string
  language: string
  code: string
}

export interface CodeRunResult {
  compiled: boolean // false in current backend
  output: string | null
  executionTimeMs: number
  testCasesPassed: number
  totalTestCases: number
  errorMessage: string | null
}

// ─── Transcript & Report DTOs ────────────────────────────────

export interface TranscriptItemDto {
  questionId?: string
  roundOrder: number
  roundType: RoundType | string
  questionOrder: number
  questionText: string
  questionCategory?: string | null
  answerText: string | null
  score: number | null
  feedback: string | null
  idealAnswer: string | null
  status?: QuestionStatus
  isFollowUp?: boolean
  timeTakenSeconds?: number | null
}

export interface InterviewTranscriptResponse {
  sessionId: string
  candidateName?: string | null
  targetRole?: string | null
  status?: string | null
  items: TranscriptItemDto[]
  turns?: TranscriptItemDto[]
}

export interface RoundBreakdownItem {
  roundOrder?: number
  roundType: RoundType | string
  roundScore: number | null
  questionsCount?: number
  completedQuestions?: number
  summary?: string
}

export interface InterviewReportResponse {
  reportId: string
  sessionId: string
  overallScore: number // 0 = not evaluated sentinel
  summary?: string
  overallFeedback?: string
  roundBreakdown?: RoundBreakdownItem[]
  roundSummaries?: RoundBreakdownItem[]
  strengths: string[]
  weaknesses: string[]
  improvementAreas?: string[]
  recommendedTopics: string[]
  generatedAt: string
}

// ─── Standard Backend Error Response ─────────────────────────

export interface ApiErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
}

// ─── WebSocket / STOMP Command & Event DTOs ──────────────────

export type InterviewCommandType =
  | 'START_INTERVIEW'
  | 'NEXT_QUESTION'
  | 'SUBMIT_ANSWER'
  | 'PAUSE_INTERVIEW'
  | 'RESUME_INTERVIEW'
  | 'SKIP_QUESTION'
  | 'END_INTERVIEW'

export interface InterviewCommandPayload {
  commandId?: string
  type: InterviewCommandType
  questionId?: string
  answerText?: string
  timeTakenSeconds?: number
}

export type InterviewEventType =
  | 'COMMAND_ACKNOWLEDGED'
  | 'INTERVIEW_STARTED'
  | 'QUESTION_GENERATED'
  | 'NEXT_QUESTION_READY'
  | 'NO_MORE_QUESTIONS'
  | 'EVALUATION_STARTED'
  | 'EVALUATION_COMPLETED'
  | 'ROUND_COMPLETED'
  | 'INTERVIEW_PAUSED'
  | 'INTERVIEW_RESUMED'
  | 'QUESTION_SKIPPED'
  | 'INTERVIEW_COMPLETED'
  | 'SESSION_COMPLETED'
  | 'COMMAND_FAILED'
  | 'ERROR'

export interface InterviewEvent<TPayload = unknown> {
  eventId: string
  commandId: string | null
  type: InterviewEventType
  eventType?: InterviewEventType | string
  turnSequence?: number
  sessionId: string
  timestamp: string
  occurredAt?: string
  payload: TPayload
  errorCode: string | null
  message: string | null
}

export type WebSocketConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'reconciling'
  | 'error'


