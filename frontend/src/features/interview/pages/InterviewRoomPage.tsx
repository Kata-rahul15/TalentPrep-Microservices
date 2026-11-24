import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Play,
  Clock,
  AlertTriangle,
  Video,
  MessageSquare,
  Mic,
} from 'lucide-react'
import {
  interviewKeys,
  useInterviewSession,
  useInterviewQuestion,
  useRunCode,
  useSubmitCode,
} from '../hooks/useInterview'
import { interviewApi } from '../api/interviewApi'
import { useInterviewWebSocket } from '../hooks/useInterviewWebSocket'
import type {
  AnswerEvaluationResponseDto,
  InterviewCommandType,
  InterviewEvent,
  InterviewInteractionMode,
  InterviewQuestionResponse,
  InterviewReportResponse,
  InterviewSessionResponse,
} from '../types/interview.types'
import { InterviewSessionProvider } from '../context/InterviewSessionContext'
import { useInterviewSessionContext } from '../hooks/useInterviewSessionContext'
import RoundProgressStepper from '../components/RoundProgressStepper'
import { formatRoundTitle } from '../utils/interviewFormatters'
import SessionControlBar from '../components/SessionControlBar'
import VoiceInterviewWorkspace from '../components/VoiceInterviewWorkspace'
import ChatInterviewWorkspace from '../components/ChatInterviewWorkspace'
import CodingInterviewWorkspace from '../components/CodingInterviewWorkspace'
import EvaluationFeedbackModal from '../components/EvaluationFeedbackModal'
import RoundTransitionModal from '../components/RoundTransitionModal'
import { getErrorMessage } from '@/services/authService'

function InnerInterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    session,
    activeQuestion,
    setActiveQuestion,
    lastEvaluation,
    setLastEvaluation,
    isEvaluating,
    setIsEvaluating,
    remainingSeconds,
    elapsedQuestionSeconds,
    resetQuestionTimer,
    clearDraft,
  } = useInterviewSessionContext()

  // Initial active-question hydration over REST (when landing directly on an IN_PROGRESS session)
  const { data: fetchedQuestion, isLoading: isLoadingQuestion } = useInterviewQuestion(
    sessionId,
    session?.status === 'IN_PROGRESS' && !activeQuestion && !lastEvaluation
  )

  // Operations that remain REST-based
  const runCodeMutation = useRunCode(sessionId!)
  const submitCodeMutation = useSubmitCode(sessionId!)

  // Interaction mode state (defaults from session or sessionStorage, togglable on the fly)
  const [interactionMode, setInteractionMode] = useState<InterviewInteractionMode>(() => {
    if (typeof window !== 'undefined' && sessionId) {
      const saved = sessionStorage.getItem(`tp_interaction_mode_${sessionId}`) as InterviewInteractionMode | null
      if (saved === 'CHAT' || saved === 'VOICE') return saved
    }
    return session?.mode === 'VOICE' ? 'VOICE' : 'CHAT'
  })

  const changeInteractionMode = useCallback(
    (nextMode: InterviewInteractionMode) => {
      setInteractionMode(nextMode)
      if (typeof window !== 'undefined' && sessionId) {
        sessionStorage.setItem(`tp_interaction_mode_${sessionId}`, nextMode)
      }
    },
    [sessionId]
  )

  const [isInterviewerThinking, setIsInterviewerThinking] = useState(false)
  const [codingAnswers, setCodingAnswers] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingCommand, setPendingCommand] = useState<InterviewCommandType | null>(null)

  const isStarting = pendingCommand === 'START_INTERVIEW'
  const isSkipping = pendingCommand === 'SKIP_QUESTION'
  const isEnding = pendingCommand === 'END_INTERVIEW'
  const isLoadingNext = pendingCommand === 'NEXT_QUESTION' || isLoadingQuestion

  // Sync REST-hydrated question to context
  useEffect(() => {
    if (fetchedQuestion?.questionStatus === 'PENDING') {
      setActiveQuestion((current) => {
        if (current?.questionId === fetchedQuestion.questionId) return current
        resetQuestionTimer()
        return fetchedQuestion
      })
    }
  }, [fetchedQuestion, setActiveQuestion, resetQuestionTimer])

  // Redirect if session is completed (wait until user dismisses final evaluation modal if visible)
  useEffect(() => {
    if (
      (session?.status === 'COMPLETED' || session?.status === 'REPORT_GENERATED') &&
      !lastEvaluation
    ) {
      sessionStorage.removeItem('talentprep_active_session_id')
      navigate(`/interview/${sessionId}/report`, { replace: true })
    }
  }, [session?.status, sessionId, navigate, lastEvaluation])

  // Authoritative REST reconciliation on WebSocket reconnect (never replay queued commands)
  const reconcileSessionFromRest = useCallback(async () => {
    if (!sessionId) return
    setPendingCommand(null)
    setIsEvaluating(false)
    setIsInterviewerThinking(false)

    try {
      const freshSession = await interviewApi.getSession(sessionId)
      queryClient.setQueryData(interviewKeys.session(sessionId), freshSession)

      if (freshSession.status === 'IN_PROGRESS') {
        try {
          const currentState = await interviewApi.getCurrentState(sessionId)
          if (currentState?.currentQuestion?.questionStatus === 'PENDING') {
            queryClient.setQueryData(interviewKeys.question(sessionId), currentState.currentQuestion)
            setActiveQuestion(currentState.currentQuestion)
          } else if (currentState && !currentState.currentQuestion) {
            queryClient.setQueryData(interviewKeys.question(sessionId), null)
            setActiveQuestion(null)
          }
        } catch {
          // Current-state is the read-only source of truth
        }
      } else if (
        freshSession.status === 'CREATED' ||
        freshSession.status === 'ROUND_TRANSITION'
      ) {
        setActiveQuestion(null)
      }
    } catch (err) {
      setErrorMessage(
        getErrorMessage(err) ||
          'Reconnected, but failed to sync latest session state. Please refresh if needed.'
      )
    }
  }, [sessionId, queryClient, setActiveQuestion, setIsEvaluating])

  const sendCommandRef = useRef<((payload: { type: InterviewCommandType }) => string) | null>(null)

  // Handle all STOMP events
  const handleInterviewEvent = useCallback(
    (event: InterviewEvent) => {
      if (sessionId && event.sessionId && event.sessionId !== sessionId) {
        return
      }

      const eventType = event.eventType || event.type

      switch (eventType) {
        case 'COMMAND_ACKNOWLEDGED':
          setErrorMessage(null)
          break

        case 'INTERVIEW_STARTED': {
          const firstQuestion = event.payload as InterviewQuestionResponse | null
          setPendingCommand(null)
          setErrorMessage(null)
          setIsInterviewerThinking(false)
          if (firstQuestion?.questionStatus === 'PENDING') {
            queryClient.setQueryData(interviewKeys.question(sessionId), firstQuestion)
            setActiveQuestion(firstQuestion)
            resetQuestionTimer()
          } else {
            setActiveQuestion(null)
          }
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break
        }

        case 'NEXT_QUESTION_READY':
        case 'QUESTION_GENERATED': {
          const nextQuestion = event.payload as InterviewQuestionResponse | null
          setPendingCommand(null)
          setErrorMessage(null)
          setIsEvaluating(false)
          setIsInterviewerThinking(false)
          if (nextQuestion?.questionStatus === 'PENDING') {
            queryClient.setQueryData(interviewKeys.question(sessionId), nextQuestion)
            setActiveQuestion(nextQuestion)
            resetQuestionTimer()
          } else {
            setActiveQuestion(null)
          }
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break
        }

        case 'NO_MORE_QUESTIONS':
          setPendingCommand(null)
          setActiveQuestion(null)
          setIsInterviewerThinking(false)
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break

        case 'EVALUATION_STARTED':
          setIsEvaluating(true)
          setErrorMessage(null)
          break

        case 'EVALUATION_COMPLETED': {
          const evalResult = event.payload as AnswerEvaluationResponseDto
          setIsEvaluating(false)
          setPendingCommand(null)
          if (session?.mode !== 'VOICE') {
            setLastEvaluation(evalResult)
          }
          clearDraft()
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break
        }

        case 'ROUND_COMPLETED': {
          const evalResult = event.payload as AnswerEvaluationResponseDto
          setIsEvaluating(false)
          setPendingCommand(null)
          setLastEvaluation(evalResult)
          clearDraft()
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break
        }

        case 'INTERVIEW_PAUSED':
          setPendingCommand(null)
          setErrorMessage(null)
          queryClient.setQueryData<InterviewSessionResponse | undefined>(
            interviewKeys.session(sessionId),
            (prev) => (prev ? { ...prev, status: 'PAUSED' } : prev)
          )
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break

        case 'INTERVIEW_RESUMED':
          setPendingCommand(null)
          setErrorMessage(null)
          queryClient.setQueryData<InterviewSessionResponse | undefined>(
            interviewKeys.session(sessionId),
            (prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : prev)
          )
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break

        case 'QUESTION_SKIPPED':
          setPendingCommand(null)
          setErrorMessage(null)
          clearDraft()
          setActiveQuestion(null)
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          if (sendCommandRef.current) {
            try {
              setPendingCommand('NEXT_QUESTION')
              sendCommandRef.current({ type: 'NEXT_QUESTION' })
            } catch (err) {
              setPendingCommand(null)
              setErrorMessage(
                getErrorMessage(err) || 'Failed to request next question after skip.'
              )
            }
          }
          break

        case 'INTERVIEW_COMPLETED': {
          setIsEvaluating(false)
          setPendingCommand(null)
          const payload = event.payload as
            | AnswerEvaluationResponseDto
            | InterviewReportResponse
            | null

          if (payload && 'evaluationId' in payload) {
            setLastEvaluation(payload)
            clearDraft()
            queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          } else {
            if (payload && 'reportId' in payload) {
              queryClient.setQueryData(interviewKeys.report(sessionId), payload)
            }
            sessionStorage.removeItem('talentprep_active_session_id')
            queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
            navigate(`/interview/${sessionId}/report`, { replace: true })
          }
          break
        }

        case 'COMMAND_FAILED':
          setIsEvaluating(false)
          setPendingCommand(null)
          setErrorMessage(
            event.message || 'Live interview command could not be completed. Please try again.'
          )
          queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
          break
      }
    },
    [
      sessionId,
      queryClient,
      setActiveQuestion,
      resetQuestionTimer,
      setIsEvaluating,
      setLastEvaluation,
      clearDraft,
      navigate,
      session?.mode,
    ]
  )

  const wsEnabled =
    Boolean(sessionId) &&
    Boolean(session) &&
    session?.status !== 'COMPLETED' &&
    session?.status !== 'REPORT_GENERATED'

  const {
    connectionStatus,
    statusDetail,
    isConnected,
    isReconciling,
    sendCommand,
    reconnect,
  } = useInterviewWebSocket({
    sessionId,
    enabled: wsEnabled,
    onEvent: handleInterviewEvent,
    onReconnect: reconcileSessionFromRest,
    onSocketError: (msg) => setErrorMessage(msg),
  })

  useEffect(() => {
    sendCommandRef.current = sendCommand
  }, [sendCommand])

  const expiryHandledRef = useRef(false)

  useEffect(() => {
    if (!sessionId || session?.status !== 'IN_PROGRESS' || !session?.startedAt) {
      return
    }
    if (remainingSeconds > 0 || expiryHandledRef.current || isEvaluating) {
      return
    }

    expiryHandledRef.current = true
    if (isConnected && !isReconciling && sendCommandRef.current) {
      try {
        sendCommandRef.current({ type: 'END_INTERVIEW' })
        return
      } catch {
        // fallback to REST
      }
    }

    interviewApi
      .endSession(sessionId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
      })
      .catch((err) => {
        expiryHandledRef.current = false
        setErrorMessage(
          getErrorMessage(err) || 'Interview duration elapsed. Please end the session to view your report.'
        )
      })
  }, [
    sessionId,
    session?.status,
    session?.startedAt,
    remainingSeconds,
    isEvaluating,
    isConnected,
    isReconciling,
    queryClient,
  ])

  const sendLiveCommand = (
    payload: Parameters<typeof sendCommand>[0],
    fallbackError: string
  ): boolean => {
    if (!sessionId) return false
    if (!isConnected || isReconciling) {
      setErrorMessage(
        'Live interview connection is syncing. Please wait a moment or click Reconnect.'
      )
      return false
    }
    setErrorMessage(null)
    setPendingCommand(payload.type)
    try {
      sendCommand(payload)
      return true
    } catch (err) {
      setPendingCommand(null)
      setErrorMessage(getErrorMessage(err) || fallbackError)
      return false
    }
  }

  // ── Handler: Start Session (WebSocket) ──
  const handleStartSession = () => {
    if (isStarting || session?.status === 'IN_PROGRESS') return
    sendLiveCommand({ type: 'START_INTERVIEW' }, 'Failed to start interview. Please try again.')
  }

  // ── SHARED ANSWER SUBMISSION PIPELINE (Both Chat & Voice Modes) ──
  const handleSharedSubmitAnswer = async (answerText: string, clientRequestId?: string) => {
    if (!sessionId || !activeQuestion || !answerText.trim() || isEvaluating) return
    setIsEvaluating(true)
    setIsInterviewerThinking(true)
    setErrorMessage(null)
    try {
      await interviewApi.submitAnswer(sessionId, {
        questionId: activeQuestion.questionId,
        answerText: answerText.trim(),
        timeTakenSeconds: elapsedQuestionSeconds,
        clientRequestId:
          clientRequestId ||
          `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      })
      clearDraft()
    } catch (err: unknown) {
      console.error('Answer submission error:', err)
      setIsEvaluating(false)
      setIsInterviewerThinking(false)
      const msg = getErrorMessage(err)
      setErrorMessage(
        msg || 'Failed to submit answer. Your draft is preserved; please retry.'
      )
      throw err
    }
  }

  // ── Handler: Run Code (REST Check) ──
  const handleRunCode = async (language: string, code: string): Promise<string | null> => {
    if (!sessionId || !activeQuestion) return null
    try {
      const res = await runCodeMutation.mutateAsync({
        questionId: activeQuestion.questionId,
        language,
        code,
      })
      return res.errorMessage || res.output || 'Code execution sandbox is currently offline.'
    } catch (err: unknown) {
      return getErrorMessage(err) || 'Code execution service is currently offline.'
    }
  }

  // ── Handler: Submit Code (REST) ──
  const handleSubmitCode = async (language: string, code: string) => {
    if (!sessionId || !activeQuestion || !code.trim()) return
    setIsEvaluating(true)
    setErrorMessage(null)
    try {
      const evalResult = await submitCodeMutation.mutateAsync({
        questionId: activeQuestion.questionId,
        language,
        code,
      })
      setLastEvaluation(evalResult)
      clearDraft()
    } catch (err: unknown) {
      console.error('Code evaluation error:', err)
      setErrorMessage(getErrorMessage(err) || 'AI code review failed. Please retry submission.')
    } finally {
      setIsEvaluating(false)
    }
  }

  // ── Handler: Continue after Evaluation Feedback ──
  const handleContinueAfterFeedback = async () => {
    const prevEval = lastEvaluation
    setLastEvaluation(null)

    if (prevEval?.interviewCompleted) {
      navigate(`/interview/${sessionId}/report`)
      return
    }

    if (prevEval?.roundCompleted) {
      await queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
      return
    }

    if (sendLiveCommand({ type: 'NEXT_QUESTION' }, 'Failed to fetch the next question.')) {
      setActiveQuestion(null)
    }
  }

  // ── Handler: Skip Question (WebSocket) ──
  const handleSkipQuestion = () => {
    if (!activeQuestion) return
    sendLiveCommand(
      { type: 'SKIP_QUESTION', questionId: activeQuestion.questionId },
      'Failed to skip question.'
    )
  }

  // ── Handler: Pause / Resume (WebSocket) ──
  const handlePauseSession = () => {
    sendLiveCommand({ type: 'PAUSE_INTERVIEW' }, 'Failed to pause interview.')
  }

  const handleResumeSession = () => {
    sendLiveCommand({ type: 'RESUME_INTERVIEW' }, 'Failed to resume interview.')
  }

  // ── Handler: End Session Early (WebSocket) ──
  const handleEndEarly = () => {
    sendLiveCommand({ type: 'END_INTERVIEW' }, 'Failed to end session.')
  }

  const renderConnectionBadge = () => {
    const labelMap: Record<typeof connectionStatus, string> = {
      connected: 'Live Sync',
      connecting: 'Connecting...',
      reconnecting: 'Reconnecting...',
      reconciling: 'Syncing State...',
      disconnected: 'Offline',
      error: 'Channel Error',
    }

    const dotColorMap: Record<typeof connectionStatus, string> = {
      connected: 'bg-emerald-500',
      connecting: 'bg-blue-500 animate-pulse',
      reconnecting: 'bg-amber-500 animate-pulse',
      reconciling: 'bg-amber-500 animate-pulse',
      disconnected: 'bg-slate-400',
      error: 'bg-rose-500',
    }

    return (
      <div className="inline-flex items-center gap-1.5">
        <span
          title={statusDetail || labelMap[connectionStatus]}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[connectionStatus]}`} />
          <span>{labelMap[connectionStatus]}</span>
        </span>
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <button
            type="button"
            onClick={() => void reconnect()}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Reconnect
          </button>
        )}
      </div>
    )
  }

  // Format countdown
  const formatCountdown = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins}:${s < 10 ? '0' : ''}${s}`
  }

  // Active round data
  const currentRound = session?.rounds?.[session?.currentRoundIndex || 0]
  const nextRound = session?.rounds?.[(session?.currentRoundIndex || 0) + 1]

  // ── VIEW 1: LOBBY / CREATED STATE ──
  if (session?.status === 'CREATED') {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pre-Flight Briefing
                </span>
                {renderConnectionBadge()}
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Ready to begin your interview
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Target Role: <strong className="text-slate-800 dark:text-slate-200 font-medium">{session.targetRole}</strong> • {session.durationMinutes} Minutes • Level: {session.difficulty}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Video className="w-5 h-5" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Planned Rounds Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Evaluation Schedule ({session.rounds?.length} Rounds)
              </h2>
              <span className="text-xs text-slate-400">Adaptive AI Evaluation</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {session.rounds?.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center">
                      0{r.roundOrder}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatRoundTitle(r.roundType)}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    ~{r.targetQuestionCount} questions
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Once started, the timer begins and the first question is synthesized.
            </p>
            <button
              type="button"
              onClick={handleStartSession}
              disabled={isStarting || !isConnected || isReconciling}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Question 01...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Interview</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── VIEW 2: ACTIVE INTERVIEW ROOM ──
  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* ── Top Header Navigation Bar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-semibold text-xs flex-shrink-0 border border-blue-100 dark:border-blue-900/40">
            <Video className="w-4 h-4" />
          </div>

          <div>
            <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-tight">
              {session?.targetRole || 'Interactive Interview'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Round 0{(session?.currentRoundIndex || 0) + 1} of 0{session?.totalRounds || 1} • {session?.difficulty}
            </p>
          </div>
        </div>

        {/* Global Timer Countdown & Live Channel Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {renderConnectionBadge()}

          {/* Interaction Mode Pill (Chat vs. Voice) for Non-Coding Rounds */}
          {activeQuestion?.roundType !== 'CODING' && (
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => changeInteractionMode('CHAT')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
                  interactionMode === 'CHAT'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to Chat Mode"
              >
                <MessageSquare className="w-3 h-3 text-blue-600" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => changeInteractionMode('VOICE')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
                  interactionMode === 'VOICE'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to Voice Mode"
              >
                <Mic className="w-3 h-3 text-rose-500" />
                <span>Voice</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="tabular-nums">{formatCountdown(remainingSeconds)}</span>
          </div>

          <SessionControlBar
            isPaused={session?.status === 'PAUSED'}
            isEnding={isEnding}
            isSkipping={isSkipping}
            isDisabled={!isConnected || isReconciling || pendingCommand !== null}
            onPause={handlePauseSession}
            onResume={handleResumeSession}
            onSkip={handleSkipQuestion}
            onEndEarly={handleEndEarly}
          />
        </div>
      </div>

      {/* ── Round Stepper ── */}
      {session?.rounds && (
        <RoundProgressStepper
          rounds={session.rounds}
          currentRoundIndex={session.currentRoundIndex || 0}
        />
      )}

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── PAUSED Overlay ── */}
      {session?.status === 'PAUSED' && (
        <div className="p-8 rounded-xl bg-slate-900 text-white text-center space-y-4 border border-slate-800">
          <p className="font-semibold text-lg sm:text-xl">
            Interview is Currently Paused
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your timer and question progress are suspended. When you are ready, click resume to continue.
          </p>
          <button
            type="button"
            onClick={handleResumeSession}
            disabled={!isConnected || isReconciling || pendingCommand !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Interview</span>
          </button>
        </div>
      )}

      {/* ── Question Loading State (between questions or initial hydration) ── */}
      {session?.status === 'IN_PROGRESS' && !activeQuestion && !lastEvaluation && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
          <div className="mx-auto w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
            {isLoadingNext ? 'Generating next interview question...' : 'Preparing question workspace...'}
          </p>
        </div>
      )}

      {/* ── Active Question Workspace ── */}
      {session?.status === 'IN_PROGRESS' && activeQuestion && (
        <div>
          {/* Round Type Router */}
          {activeQuestion.roundType === 'CODING' ? (
            <CodingInterviewWorkspace
              question={activeQuestion}
              codeText={
                codingAnswers[activeQuestion.questionId] ??
                activeQuestion.codingBoilerplate ??
                ''
              }
              onChangeCode={(nextCode) =>
                setCodingAnswers((prev) => ({
                  ...prev,
                  [activeQuestion.questionId]: nextCode,
                }))
              }
              onRunCode={handleRunCode}
              onSubmitCode={handleSubmitCode}
              isSubmitting={isEvaluating}
              isTesting={runCodeMutation.isPending}
              elapsedSeconds={elapsedQuestionSeconds}
            />
          ) : interactionMode === 'VOICE' ? (
            <VoiceInterviewWorkspace
              question={activeQuestion}
              onSubmitAnswer={handleSharedSubmitAnswer}
              onSwitchToChat={() => changeInteractionMode('CHAT')}
              isSubmitting={isEvaluating && !isInterviewerThinking}
              isThinking={isInterviewerThinking}
              elapsedSeconds={elapsedQuestionSeconds}
              wsConnected={isConnected}
            />
          ) : (
            <ChatInterviewWorkspace
              question={activeQuestion}
              sessionId={sessionId!}
              onSubmitAnswer={handleSharedSubmitAnswer}
              onSwitchToVoice={() => changeInteractionMode('VOICE')}
              isSubmitting={isEvaluating && !isInterviewerThinking}
              isThinking={isInterviewerThinking}
              elapsedSeconds={elapsedQuestionSeconds}
              wsConnected={isConnected}
            />
          )}
        </div>
      )}

      {/* ── ROUND TRANSITION MODAL ── */}
      {session?.status === 'ROUND_TRANSITION' && (
        <RoundTransitionModal
          completedRound={currentRound}
          nextRound={nextRound}
          onStartNextRound={() => {
            sendLiveCommand(
              { type: 'NEXT_QUESTION' },
              'Failed to advance to the next round.'
            )
          }}
          isLoading={isLoadingNext}
        />
      )}

      {/* ── EVALUATION FEEDBACK MODAL ── */}
      {lastEvaluation && (
        <EvaluationFeedbackModal
          evaluation={lastEvaluation}
          onContinue={handleContinueAfterFeedback}
        />
      )}
    </div>
  )
}

export default function InterviewRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { data: session, dataUpdatedAt, isLoading, error } = useInterviewSession(sessionId)

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Connecting to Interview Session...</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="font-semibold text-base text-slate-900 dark:text-slate-100">
          Session Not Found or Access Denied
        </h2>
        <p className="text-xs text-slate-500 max-w-sm text-center">
          {error ? getErrorMessage(error) : 'Unable to load interview session.'}
        </p>
      </div>
    )
  }

  return (
    <InterviewSessionProvider
      sessionId={sessionId!}
      session={session}
      sessionUpdatedAt={dataUpdatedAt}
    >
      <InnerInterviewRoom />
    </InterviewSessionProvider>
  )
}
