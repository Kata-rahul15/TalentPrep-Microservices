import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  InterviewSessionResponse,
  InterviewQuestionResponse,
  AnswerEvaluationResponseDto,
} from '../types/interview.types'
import { InterviewSessionContext } from '../hooks/useInterviewSessionContext'

interface ProviderProps {
  sessionId: string
  session: InterviewSessionResponse | undefined
  sessionUpdatedAt?: number
  children: React.ReactNode
}

export function InterviewSessionProvider({
  sessionId,
  session,
  sessionUpdatedAt,
  children,
}: ProviderProps) {
  const [activeQuestion, setActiveQuestion] = useState<InterviewQuestionResponse | null>(null)
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluationResponseDto | null>(null)
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false)

  // Local draft answer preserved per session & question
  const draftStorageKey = `tp_interview_draft_${sessionId}_${activeQuestion?.questionId || 'current'}`
  const [draftAnswer, setDraftAnswerState] = useState<string>(() => {
    return sessionStorage.getItem(draftStorageKey) || ''
  })

  const setDraftAnswer = useCallback(
    (val: string) => {
      setDraftAnswerState(val)
      if (val) {
        sessionStorage.setItem(draftStorageKey, val)
      } else {
        sessionStorage.removeItem(draftStorageKey)
      }
    },
    [draftStorageKey]
  )

  const clearDraft = useCallback(() => {
    setDraftAnswerState('')
    sessionStorage.removeItem(draftStorageKey)
  }, [draftStorageKey])

  // Wall-clock tick updated every second while IN_PROGRESS
  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  const [questionStartedAtMs, setQuestionStartedAtMs] = useState<number>(() => Date.now())

  const resetQuestionTimer = useCallback(() => {
    setQuestionStartedAtMs(Date.now())
  }, [])

  useEffect(() => {
    if (session?.status !== 'IN_PROGRESS') return

    const interval = setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [session?.status])

  // Derive remainingSeconds cleanly from server-authoritative snapshot + elapsed since fetch
  const remainingSeconds = useMemo(() => {
    const fallbackTotal = (session?.durationMinutes || 45) * 60
    const serverRemaining =
      typeof session?.remainingSeconds === 'number'
        ? Math.max(0, session.remainingSeconds)
        : fallbackTotal

    if (!session || session.status !== 'IN_PROGRESS') {
      return serverRemaining
    }

    const baselineMs = sessionUpdatedAt && sessionUpdatedAt > 0 ? sessionUpdatedAt : nowMs
    const elapsedSinceFetchSeconds = Math.max(0, Math.floor((nowMs - baselineMs) / 1000))
    return Math.max(0, serverRemaining - elapsedSinceFetchSeconds)
  }, [session, sessionUpdatedAt, nowMs])

  const elapsedQuestionSeconds = useMemo(() => {
    if (session?.status !== 'IN_PROGRESS') return 0
    return Math.max(0, Math.floor((nowMs - questionStartedAtMs) / 1000))
  }, [session?.status, nowMs, questionStartedAtMs])

  return (
    <InterviewSessionContext.Provider
      value={{
        sessionId,
        session,
        activeQuestion,
        setActiveQuestion,
        lastEvaluation,
        setLastEvaluation,
        isEvaluating,
        setIsEvaluating,
        draftAnswer,
        setDraftAnswer,
        remainingSeconds,
        elapsedQuestionSeconds,
        resetQuestionTimer,
        clearDraft,
      }}
    >
      {children}
    </InterviewSessionContext.Provider>
  )
}
