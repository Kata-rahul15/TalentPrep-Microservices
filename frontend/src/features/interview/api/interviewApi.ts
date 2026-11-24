import { api } from '@/services/authService'
import type {
  CandidateSetupDetailsResponse,
  CreateInterviewRequest,
  InterviewSessionResponse,
  InterviewQuestionResponse,
  SubmitAnswerRequest,
  AnswerAcceptedResponse,
  CurrentInterviewStateResponse,
  AnswerEvaluationResponseDto,
  CodeSubmissionRequest,
  CodeRunResult,
  InterviewTranscriptResponse,
  InterviewReportResponse,
} from '../types/interview.types'

export const interviewApi = {
  /**
   * GET /api/interviews/setup or /api/interviews/setup?resumeId={uuid}
   * Prefills candidate profile and user quota availability from Resume Service.
   */
  getSetupDetails: async (resumeId?: string, signal?: AbortSignal): Promise<CandidateSetupDetailsResponse> => {
    const response = await api.get('/api/interviews/setup', {
      params: resumeId ? { resumeId } : undefined,
      signal,
    })
    return response.data
  },

  /**
   * POST /api/interviews
   * Atomically reserves quota, snapshots candidate context, and creates the session.
   */
  createSession: async (data: CreateInterviewRequest): Promise<InterviewSessionResponse> => {
    const response = await api.post('/api/interviews', data, {
      headers: data.idempotencyKey ? { 'Idempotency-Key': data.idempotencyKey } : undefined,
    })
    return response.data
  },

  /**
   * GET /api/interviews/{id}
   * Retrieves session metadata, round statuses, and current index.
   */
  getSession: async (id: string): Promise<InterviewSessionResponse> => {
    if (!id || !id.trim()) {
      throw new Error('Interview session ID must not be empty')
    }
    const response = await api.get(`/api/interviews/${id}`)
    return response.data
  },

  /**
   * GET /api/interviews/{id}/current-state
   * Retrieves authoritative session status, turnSequence, and active question for reconnect reconciliation.
   */
  getCurrentState: async (id: string): Promise<CurrentInterviewStateResponse> => {
    const response = await api.get(`/api/interviews/${id}/current-state`)
    return response.data
  },

  /**
   * POST /api/interviews/{id}/start
   * Consumes reserved quota, activates session and first round, and generates Question 1.
   */
  startSession: async (id: string): Promise<InterviewQuestionResponse> => {
    const response = await api.post(`/api/interviews/${id}/start`)
    return response.data
  },

  /**
   * GET /api/interviews/{id}/next-question
   * Returns current pending question or generates next in sequence. Returns null on 204 No Content.
   */
  getNextQuestion: async (id: string): Promise<InterviewQuestionResponse | null> => {
    const response = await api.get(`/api/interviews/${id}/next-question`)
    if (response.status === 204 || !response.data) {
      return null
    }
    return response.data
  },

  /**
   * POST /api/interviews/{id}/answers
   * Submits typed or voice transcribed answer asynchronously.
   * Returns HTTP 202 Accepted with answerId and status "RECEIVED".
   */
  submitAnswer: async (
    id: string,
    data: SubmitAnswerRequest
  ): Promise<AnswerAcceptedResponse> => {
    const payload: SubmitAnswerRequest = {
      ...data,
      clientRequestId:
        data.clientRequestId ||
        `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }
    const response = await api.post(`/api/interviews/${id}/answers`, payload)
    return response.data
  },

  /**
   * POST /api/interviews/{id}/voice-answer
   * Submits audio recording (multipart/form-data, max 25MB) for Whisper STT and AI evaluation.
   */
  submitVoiceAnswer: async (
    id: string,
    questionId: string,
    audioFile: Blob | File
  ): Promise<AnswerEvaluationResponseDto> => {
    const formData = new FormData()
    formData.append('questionId', questionId)

    // Ensure audio file has a filename and mime type
    const fileToUpload =
      audioFile instanceof File
        ? audioFile
        : new File([audioFile], 'voice-answer.webm', { type: audioFile.type || 'audio/webm' })

    formData.append('audio', fileToUpload)

    const response = await api.post(`/api/interviews/${id}/voice-answer`, formData)
    return response.data
  },

  /**
   * POST /api/interviews/{id}/code/run
   * Requests code execution. Backend reports unavailable notice rather than pretending tests passed.
   */
  runCode: async (id: string, data: CodeSubmissionRequest): Promise<CodeRunResult> => {
    const response = await api.post(`/api/interviews/${id}/code/run`, data)
    return response.data
  },

  /**
   * POST /api/interviews/{id}/code/submit
   * Submits source code text directly for AI review and scoring.
   */
  submitCode: async (
    id: string,
    data: CodeSubmissionRequest
  ): Promise<AnswerEvaluationResponseDto> => {
    const response = await api.post(`/api/interviews/${id}/code/submit`, data)
    return response.data
  },

  /**
   * POST /api/interviews/{id}/pause
   * Pauses an active interview session.
   */
  pauseSession: async (id: string): Promise<void> => {
    await api.post(`/api/interviews/${id}/pause`)
  },

  /**
   * POST /api/interviews/{id}/resume
   * Resumes a paused interview session.
   */
  resumeSession: async (id: string): Promise<void> => {
    await api.post(`/api/interviews/${id}/resume`)
  },

  /**
   * POST /api/interviews/{id}/skip?questionId={uuid}
   * Skips current question (marks it SKIPPED with 0 score).
   */
  skipQuestion: async (id: string, questionId: string): Promise<void> => {
    await api.post(`/api/interviews/${id}/skip`, null, {
      params: { questionId },
    })
  },

  /**
   * POST /api/interviews/{id}/end
   * Ends session early and compiles final report.
   */
  endSession: async (id: string): Promise<InterviewReportResponse> => {
    const response = await api.post(`/api/interviews/${id}/end`)
    return response.data
  },

  /**
   * GET /api/interviews/{id}/transcript
   * Full conversational transcript with question and answer history.
   */
  getTranscript: async (id: string): Promise<InterviewTranscriptResponse> => {
    const response = await api.get(`/api/interviews/${id}/transcript`)
    return response.data
  },

  /**
   * GET /api/interviews/{id}/report
   * Final comprehensive interview performance report.
   */
  getReport: async (id: string): Promise<InterviewReportResponse> => {
    const response = await api.get(`/api/interviews/${id}/report`)
    return response.data
  },
}

