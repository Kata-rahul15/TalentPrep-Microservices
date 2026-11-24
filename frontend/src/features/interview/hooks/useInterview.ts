import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interviewApi } from '../api/interviewApi'
import type {
  CreateInterviewRequest,
  SubmitAnswerRequest,
  CodeSubmissionRequest,
} from '../types/interview.types'

// ─── Query Key Factory ──────────────────────────────────────────

export const interviewKeys = {
  all: ['interviews'] as const,
  setup: (resumeId?: string | null) => [...interviewKeys.all, 'setup', resumeId || 'active'] as const,
  session: (id?: string | null) => [...interviewKeys.all, 'session', id || ''] as const,
  question: (sessionId?: string | null) => [...interviewKeys.all, 'question', sessionId || ''] as const,
  transcript: (id?: string | null) => [...interviewKeys.all, 'transcript', id || ''] as const,
  report: (id?: string | null) => [...interviewKeys.all, 'report', id || ''] as const,
}

// ─── Queries ────────────────────────────────────────────────────

/**
 * Loads prefilled candidate setup details and quota availability.
 */
export function useInterviewSetup(resumeId?: string, enabled = true) {
  return useQuery({
    queryKey: interviewKeys.setup(resumeId),
    queryFn: ({ signal }) => interviewApi.getSetupDetails(resumeId, signal),
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

/**
 * Fetches session metadata, lifecycle state, and round progression.
 */
export function useInterviewSession(sessionId?: string, enabled = true) {
  return useQuery({
    queryKey: interviewKeys.session(sessionId),
    queryFn: () => {
      if (!sessionId || !sessionId.trim()) {
        throw new Error('Interview session ID must not be empty')
      }
      return interviewApi.getSession(sessionId)
    },
    enabled: Boolean(sessionId && sessionId.trim()) && enabled,
    staleTime: 10 * 1000,
  })
}

/**
 * Retrieves the pending question or generates next in sequence.
 */
export function useInterviewQuestion(sessionId?: string, enabled = true) {
  return useQuery({
    queryKey: interviewKeys.question(sessionId),
    queryFn: async () => {
      const state = await interviewApi.getCurrentState(sessionId!)
      return state.currentQuestion
    },
    enabled: Boolean(sessionId) && enabled,
    staleTime: 0,
  })
}

/**
 * Fetches the aggregated interview report.
 */
export function useInterviewReport(sessionId?: string) {
  return useQuery({
    queryKey: interviewKeys.report(sessionId),
    queryFn: () => interviewApi.getReport(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetches the conversational transcript.
 */
export function useInterviewTranscript(sessionId?: string) {
  return useQuery({
    queryKey: interviewKeys.transcript(sessionId),
    queryFn: () => interviewApi.getTranscript(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Mutations ──────────────────────────────────────────────────

/**
 * Creates session and reserves quota.
 */
export function useCreateInterviewSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInterviewRequest) => interviewApi.createSession(data),
    onSuccess: (session) => {
      if (session?.id) {
        queryClient.setQueryData(interviewKeys.session(session.id), session)
      }
    },
  })
}

/**
 * Starts the interview session and returns Question 1.
 */
export function useStartInterviewSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.startSession(sessionId),
    onSuccess: (data, sessionId) => {
      queryClient.setQueryData(interviewKeys.question(sessionId), data)
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

/**
 * Submits a typed text answer and receives AI evaluation.
 */
export function useSubmitAnswer(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitAnswerRequest) => interviewApi.submitAnswer(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

/**
 * Submits an audio voice answer file.
 */
export function useSubmitVoiceAnswer(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId, audioFile }: { questionId: string; audioFile: Blob | File }) =>
      interviewApi.submitVoiceAnswer(sessionId, questionId, audioFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

/**
 * Requests code execution status (reports sandbox unavailable).
 */
export function useRunCode(sessionId: string) {
  return useMutation({
    mutationFn: (data: CodeSubmissionRequest) => interviewApi.runCode(sessionId, data),
  })
}

/**
 * Submits source code for AI review.
 */
export function useSubmitCode(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CodeSubmissionRequest) => interviewApi.submitCode(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

/**
 * Pauses session.
 */
export function usePauseSession(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => interviewApi.pauseSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

/**
 * Resumes paused session.
 */
export function useResumeSession(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => interviewApi.resumeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

/**
 * Skips current question.
 */
export function useSkipQuestion(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) => interviewApi.skipQuestion(sessionId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

/**
 * Ends session early and compiles report.
 */
export function useEndSession(sessionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => interviewApi.endSession(sessionId),
    onSuccess: (report) => {
      queryClient.setQueryData(interviewKeys.report(sessionId), report)
      queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
    },
  })
}

