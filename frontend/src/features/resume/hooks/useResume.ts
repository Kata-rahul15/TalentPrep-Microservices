import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { resumeApi } from '../api/resumeApi'
import { useResumeContext } from '../context/ResumeContext'

import type {
  ChatMessage,
  JobMatchInput,
} from '../types/resume.types'

import {
  useState,
  useCallback,
} from 'react'

// ─────────────────────────────────────────────────────────────
// Query Keys (ID-isolated)
// ─────────────────────────────────────────────────────────────

export const resumeKeys = {
  all: ['resume'] as const,

  list: () =>
    [...resumeKeys.all, 'list'] as const,

  file: (id?: string | null) =>
    [...resumeKeys.all, 'file', id || 'current'] as const,

  status: (id?: string | null) =>
    [...resumeKeys.all, 'status', id || 'current'] as const,

  details: (id?: string | null) =>
    [...resumeKeys.all, 'details', id || 'current'] as const,

  overview: (id?: string | null) =>
    [...resumeKeys.all, 'overview', id || 'current'] as const,

  evaluation: (id?: string | null) =>
    [...resumeKeys.all, 'evaluation', id || 'current'] as const,
}


// ─────────────────────────────────────────────────────────────
// useResume
// ─────────────────────────────────────────────────────────────

/**
 * Fetches resume metadata by ID or latest.
 * Uses selectedResumeId from context if no ID override passed.
 */
export function useResume(resumeIdOverride?: string | null) {
  let selectedId: string | null = null
  try {
    const context = useResumeContext()
    selectedId = context.selectedResumeId
  } catch {
    selectedId = null
  }

  const targetId = resumeIdOverride ?? selectedId ?? undefined

  return useQuery({
    queryKey: resumeKeys.file(targetId),

    queryFn: async () => {
      const file = await resumeApi.getResume(targetId)
      return file
    },

    staleTime: 5 * 60 * 1000,

    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'processing') {
        return 2500
      }
      return false
    },
  })
}


// ─────────────────────────────────────────────────────────────
// useResumes
// ─────────────────────────────────────────────────────────────

/**
 * Fetches all uploaded resume records for the current user.
 */
export function useResumes() {
  return useQuery({
    queryKey: resumeKeys.list(),
    queryFn: () => resumeApi.getResumesList(),
    staleTime: 5 * 60 * 1000,
  })
}


// ─────────────────────────────────────────────────────────────
// useResumeStatus
// ─────────────────────────────────────────────────────────────

/**
 * Polls status for a specific resumeId until terminal status.
 */
export function useResumeStatus(
  resumeId?: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: resumeKeys.status(resumeId),

    queryFn: () => resumeApi.getResumeById(resumeId!),

    enabled: enabled && Boolean(resumeId),

    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'processing') {
        return 2500
      }
      return false
    },

    retry: 3,
  })
}


// ─────────────────────────────────────────────────────────────
// useResumeDetails
// ─────────────────────────────────────────────────────────────

/**
 * Fetches structured/parsed resume content for selected or target resume ID.
 * Prevented until status === 'ready'.
 */
export function useResumeDetails(
  resumeIdOverride?: string | null,
  enabled: boolean = true
) {
  const { data: resume } = useResume(resumeIdOverride)
  const targetId = resumeIdOverride ?? resume?.id ?? undefined

  const canLoadDetails =
    enabled &&
    Boolean(targetId) &&
    resume?.status === 'ready'

  return useQuery({
    queryKey: resumeKeys.details(targetId),

    queryFn: () => resumeApi.getResumeDetails(targetId!),

    staleTime: 5 * 60 * 1000,

    enabled: canLoadDetails,
  })
}


// ─────────────────────────────────────────────────────────────
// useResumeOverview
// ─────────────────────────────────────────────────────────────

/**
 * Fetches resume overview dashboard data for selected or target resume ID.
 * Prevented until status === 'ready'.
 */
export function useResumeOverview(
  resumeIdOverride?: string | null,
  enabled: boolean = true
) {
  const { data: resume } = useResume(resumeIdOverride)
  const targetId = resumeIdOverride ?? resume?.id ?? undefined

  const canLoadOverview =
    enabled &&
    Boolean(targetId) &&
    resume?.status === 'ready'

  return useQuery({
    queryKey: resumeKeys.overview(targetId),

    queryFn: () => resumeApi.getResumeOverview(targetId!),

    staleTime: 5 * 60 * 1000,

    enabled: canLoadOverview,
  })
}


// ─────────────────────────────────────────────────────────────
// useResumeEvaluation
// ─────────────────────────────────────────────────────────────

/**
 * Fetches already-generated ATS evaluation for selected or target resume ID.
 * Prevented until status === 'ready'.
 */
export function useResumeEvaluation(
  resumeIdOverride?: string | null,
  enabled: boolean = true
) {
  const { data: resume } = useResume(resumeIdOverride)
  const targetId = resumeIdOverride ?? resume?.id ?? undefined

  const canLoadEvaluation =
    enabled &&
    Boolean(targetId) &&
    resume?.status === 'ready'

  return useQuery({
    queryKey: resumeKeys.evaluation(targetId),

    queryFn: () => resumeApi.getAtsAnalysis(targetId!),

    staleTime: 10 * 60 * 1000,

    enabled: canLoadEvaluation,
  })
}


// ─────────────────────────────────────────────────────────────
// useUploadResume
// ─────────────────────────────────────────────────────────────

/**
 * Triggers modal upload flow via context.
 */
export function useUploadResume() {
  const queryClient = useQueryClient()
  let context: ReturnType<typeof useResumeContext> | null = null
  try {
    context = useResumeContext()
  } catch {
    context = null
  }

  return useMutation({
    mutationFn: async (file: File) => {
      if (context) {
        return await context.startUpload(file)
      } else {
        const res = await resumeApi.uploadResume(file)
        return res.id
      }
    },

    onSuccess: (newId) => {
      if (newId) {
        queryClient.invalidateQueries({
          queryKey: resumeKeys.all,
        })
      }
    },
  })
}


// ─────────────────────────────────────────────────────────────
// useEvaluateResume
// ─────────────────────────────────────────────────────────────

/**
 * Re-fetches ATS evaluation for the selected resume.
 */
export function useEvaluateResume(resumeIdOverride?: string | null) {
  const queryClient = useQueryClient()
  const { data: resume } = useResume(resumeIdOverride)
  const targetId = resumeIdOverride ?? resume?.id

  return useMutation({
    mutationFn: () => resumeApi.getAtsAnalysis(targetId!),

    onSuccess: (data) => {
      if (targetId) {
        queryClient.setQueryData(resumeKeys.evaluation(targetId), data)
      }
    },
  })
}


// ─────────────────────────────────────────────────────────────
// useJobMatch & useJobMatchStatus
// ─────────────────────────────────────────────────────────────

export function useJobMatch() {
  return useMutation({
    mutationFn: ({
      input,
      resumeId,
    }: {
      input: JobMatchInput
      resumeId: string
    }) => resumeApi.matchJob(input, resumeId),
  })
}

export function useJobMatchStatus(
  resumeId?: string,
  matchId?: string
) {
  return useQuery({
    queryKey: ['job-match', resumeId, matchId],

    queryFn: () =>
      resumeApi.getJobMatchStatus(resumeId!, matchId!),

    enabled: Boolean(resumeId) && Boolean(matchId),

    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'COMPLETED' || status === 'FAILED') {
        return false
      }
      return 2000
    },
  })
}


// ─────────────────────────────────────────────────────────────
// useResumeChat
// ─────────────────────────────────────────────────────────────

export function useResumeChat() {
  const { selectedResumeId } = useResumeContext()
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Hi! I'm your **Resume AI Assistant**. I've analyzed your resume and I'm ready to answer questions about your experience, skills, projects, and how to improve your profile. What would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim()

      if (!trimmedContent || isLoading) {
        return
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmedContent,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        if (!selectedResumeId) throw new Error('Select or create a resume before using the AI agent.')
        const response = await resumeApi.chat(selectedResumeId, trimmedContent, conversationId)
        if (response.conversationId) setConversationId(response.conversationId)
        setMessages((prev) => [...prev, response])
      } catch (err) {
        console.error('[Resume Chat] Failed:', err)
        setError('Failed to get a response. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, selectedResumeId, conversationId]
  )

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "👋 Hi! I'm your **Resume AI Assistant**. I've analyzed your resume and I'm ready to answer questions about your experience, skills, projects, and how to improve your profile. What would you like to know?",
        timestamp: new Date().toISOString(),
      },
    ])
    setError(null)
    setConversationId(undefined)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  }
}