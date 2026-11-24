import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
  AvatarAnimationState,
  CodeRunResult,
  ConversationMessage,
  InterviewCommandType,
  InterviewEvent,
  InterviewQuestionResponse,
  InterviewReportResponse,
  InterviewSessionResponse,
} from '../types/interview.types'
import { InterviewSessionProvider } from '../context/InterviewSessionContext'
import { useInterviewSessionContext } from '../hooks/useInterviewSessionContext'
import { useAuth, getErrorMessage } from '@/services/authService'
import { formatRoundTitle } from '../utils/interviewFormatters'

// New Video Interview Room Components
import InterviewDeviceSetup from '../components/room/InterviewDeviceSetup'
import InterviewRoomHeader from '../components/room/InterviewRoomHeader'
import AIInterviewerPanel from '../components/room/AIInterviewerPanel'
import CandidateVideoPanel from '../components/room/CandidateVideoPanel'
import InterviewConversation from '../components/room/InterviewConversation'
import InterviewInputBar from '../components/room/InterviewInputBar'
import SystemDesignWorkspace from '../components/room/SystemDesignWorkspace'

// Existing Modals and Coding Workspace
import CodingInterviewWorkspace from '../components/CodingInterviewWorkspace'
import EvaluationFeedbackModal from '../components/EvaluationFeedbackModal'
import RoundTransitionModal from '../components/RoundTransitionModal'

// Audio & Speech Hooks
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { Code2, MessageSquare } from 'lucide-react'

function InnerInterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

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

  // Candidate display name derived dynamically from profile
  const candidateName = user?.username || 'Candidate'

  // Device & Setup States
  const [hasJoinedRoom, setHasJoinedRoom] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && sessionId) {
      if (sessionStorage.getItem(`tp_room_joined_${sessionId}`) === 'true') {
        return true
      }
    }
    // If session is already in progress or paused, candidate already completed setup
    return session?.status === 'IN_PROGRESS' || session?.status === 'PAUSED'
  })

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const activeVideoTracksRef = useRef<Set<MediaStreamTrack>>(new Set())

  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isAudioMuted, setIsAudioMuted] = useState(false)

  // ── Centralized Startup Sequence State Machine ──
  // Stage flow: INITIALIZING -> GREETING -> TRANSITION -> FIRST_QUESTION -> LISTENING -> INTERVIEW_ACTIVE
  type StartupStage =
    | 'INITIALIZING'
    | 'GREETING'
    | 'TRANSITION'
    | 'FIRST_QUESTION'
    | 'LISTENING'
    | 'INTERVIEW_ACTIVE'

  const [startupStage, setStartupStage] = useState<StartupStage>(() => {
    if (typeof window !== 'undefined' && sessionId) {
      if (sessionStorage.getItem(`tp_room_joined_${sessionId}`) === 'true') {
        return session?.status === 'IN_PROGRESS' || session?.status === 'PAUSED'
          ? 'INTERVIEW_ACTIVE'
          : 'INITIALIZING'
      }
    }
    return 'INITIALIZING'
  })
  const startupStageRef = useRef<StartupStage>(startupStage)
  useEffect(() => {
    startupStageRef.current = startupStage
  }, [startupStage])

  const stagedQuestionRef = useRef<InterviewQuestionResponse | null>(null)
  const [, setStagedQuestion] = useState<InterviewQuestionResponse | null>(null)
  const activeQuestionRef = useRef(activeQuestion)
  useEffect(() => {
    activeQuestionRef.current = activeQuestion
  }, [activeQuestion])

  // System design whiteboard drawer state
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false)

  // Coding workspace view tab ('code' | 'conversation')
  const [codingActiveTab, setCodingActiveTab] = useState<'code' | 'conversation'>('code')

  // Coding answers dictionary (questionId -> code)
  const [codingAnswers, setCodingAnswers] = useState<Record<string, string>>({})

  // Continuous Conversation Messages State
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingCommand, setPendingCommand] = useState<InterviewCommandType | null>(null)
  const [isInterviewerThinking, setIsInterviewerThinking] = useState(false)

  const hasHydratedRef = useRef(false)
  const startedFromDeviceSetupRef = useRef(false)
  const greetingSpokenRef = useRef(false)
  const lastSpokenQuestionIdRef = useRef<string | null>(null)
  const clientRequestIdRef = useRef<string | null>(null)

  // Initial active question hydration over REST (when landing on IN_PROGRESS directly)
  const { data: fetchedQuestion, isLoading: isLoadingQuestion } = useInterviewQuestion(
    sessionId,
    session?.status === 'IN_PROGRESS' && !activeQuestion && !lastEvaluation
  )

  const runCodeMutation = useRunCode(sessionId!)
  const submitCodeMutation = useSubmitCode(sessionId!)

  const isStarting = pendingCommand === 'START_INTERVIEW'
  const isEnding = pendingCommand === 'END_INTERVIEW'
  const isLoadingNext = pendingCommand === 'NEXT_QUESTION' || isLoadingQuestion

  // ── Speech Recognition (Candidate STT) ──
  const {
    finalTranscript,
    interimTranscript,
    isListening,
    isSpeaking: isCandidateSpeaking,
    isSupported: isSttSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useSpeechRecognition('en-IN')

  // Sync finalized transcript into input text seamlessly
  useEffect(() => {
    if (finalTranscript) {
      setInputText(finalTranscript)
    }
  }, [finalTranscript])

  // ── Speech Synthesis (Interviewer TTS) ──
  const stopListeningRef = useRef(stopListening)
  useEffect(() => {
    stopListeningRef.current = stopListening
  }, [stopListening])

  const handleTtsStart = useCallback(() => {
    // When interviewer starts speaking, stop candidate microphone immediately
    stopListeningRef.current()
  }, [])

  const handleTtsEnd = useCallback(() => {
    // Fallback utterance end
  }, [])

  const {
    speak,
    cancel: cancelSpeech,
    unlockAudio,
    isSpeaking: isInterviewerSpeaking,
  } = useSpeechSynthesis(handleTtsEnd, handleTtsStart)

  const cancelSpeechRef = useRef(cancelSpeech)
  useEffect(() => {
    cancelSpeechRef.current = cancelSpeech
  }, [cancelSpeech])

  // ── Camera Toggle & Full Hardware Resource Management ──
  const handleToggleCamera = useCallback(async () => {
    if (isCameraEnabled) {
      // 1. Stop every active video track using MediaStreamTrack.stop()
      const tracksToStop = new Set<MediaStreamTrack>([
        ...activeVideoTracksRef.current,
        ...(mediaStreamRef.current?.getVideoTracks() || []),
        ...(mediaStream?.getVideoTracks() || []),
      ])

      tracksToStop.forEach((track) => {
        try {
          track.enabled = false
          track.stop()
        } catch (e) {
          console.warn('Error stopping video track:', e)
        }
        activeVideoTracksRef.current.delete(track)
      })

      const currentStream = mediaStreamRef.current || mediaStream
      const remainingAudioTracks = currentStream ? currentStream.getAudioTracks() : []
      const nextStream = remainingAudioTracks.length > 0 ? new MediaStream(remainingAudioTracks) : null
      mediaStreamRef.current = nextStream
      setMediaStream(nextStream)
      setIsCameraEnabled(false)
    } else {
      // 2. Turning Camera ON: acquire fresh camera stream
      try {
        // Stop any dangling video tracks first
        activeVideoTracksRef.current.forEach((t) => {
          try { t.enabled = false; t.stop() } catch {}
        })
        activeVideoTracksRef.current.clear()

        const freshStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        const newVideoTrack = freshStream.getVideoTracks()[0]
        if (newVideoTrack) {
          activeVideoTracksRef.current.add(newVideoTrack)
        }
        // Stop extra tracks
        freshStream.getVideoTracks().slice(1).forEach((t) => {
          try { t.enabled = false; t.stop() } catch {}
        })
        freshStream.getAudioTracks().forEach((t) => {
          try { t.enabled = false; t.stop() } catch {}
        })

        if (newVideoTrack) {
          const currentAudioTracks = (mediaStreamRef.current || mediaStream)?.getAudioTracks() || []
          const combinedStream = new MediaStream([...currentAudioTracks, newVideoTrack])
          mediaStreamRef.current = combinedStream
          setMediaStream(combinedStream)
          setIsCameraEnabled(true)
        }
      } catch (err) {
        console.warn('Failed to re-acquire camera stream:', err)
        setIsCameraEnabled(false)
        setErrorMessage('Unable to access camera. Please check browser permissions.')
      }
    }
  }, [isCameraEnabled, mediaStream])

  // ── Microphone Toggle & Resource Management ──
  const handleToggleMic = useCallback(() => {
    const nextState = !isMicEnabled
    setIsMicEnabled(nextState)
    const activeStream = mediaStreamRef.current || mediaStream
    if (activeStream) {
      activeStream.getAudioTracks().forEach((track) => {
        track.enabled = nextState
      })
    }
    if (!nextState) {
      stopListening()
    }
  }, [isMicEnabled, mediaStream, stopListening])

  // ── Avatar Animation State Derivation ──
  const avatarState: AvatarAnimationState = useMemo(() => {
    if ((startupStage === 'GREETING' || startupStage === 'TRANSITION') && !isAudioMuted) return 'speaking'
    if (isInterviewerSpeaking && !isAudioMuted) return 'speaking'
    if (isEvaluating || isInterviewerThinking || (startupStage === 'FIRST_QUESTION' && !activeQuestion)) return 'thinking'
    if (isListening || isCandidateSpeaking) return 'listening'
    return 'idle'
  }, [
    startupStage,
    isAudioMuted,
    isInterviewerSpeaking,
    isEvaluating,
    isInterviewerThinking,
    activeQuestion,
    isListening,
    isCandidateSpeaking,
  ])

  // ── Step 4 & 5: Activate and Speak Question ──
  const activateQuestion = useCallback((q: InterviewQuestionResponse) => {
    stagedQuestionRef.current = null
    setStagedQuestion(null)
    setIsInterviewerThinking(false)
    setActiveQuestion(q)
    resetQuestionTimer()

    // Append AI question message to conversation if not already present
    setMessages((prev) => {
      if (prev.some((m) => m.questionId === q.questionId)) return prev
      return [
        ...prev,
        {
          id: `q-${q.questionId}`,
          sender: 'ai',
          text: q.questionText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          kind: 'question',
          questionId: q.questionId,
          questionOrder: q.questionOrder,
          topic: q.topic || q.questionCategory,
          roundType: q.roundType,
          isFollowUp: q.isFollowUp,
          depth: q.depth,
        },
      ]
    })

    if (q.roundType !== 'CODING' && !isAudioMuted) {
      lastSpokenQuestionIdRef.current = q.questionId
      speak(q.questionText, q.questionId, false, () => {
        // Only after question playback finishes, activate candidate listening!
        setStartupStage('LISTENING')
        if (isMicEnabled && isSttSupported && !isEvaluating) {
          void startListening()
        }
        setStartupStage('INTERVIEW_ACTIVE')
      })
    } else {
      setStartupStage('LISTENING')
      if (isMicEnabled && isSttSupported && !isEvaluating) {
        void startListening()
      }
      setStartupStage('INTERVIEW_ACTIVE')
    }
  }, [isAudioMuted, speak, setActiveQuestion, resetQuestionTimer, isMicEnabled, isSttSupported, isEvaluating, startListening])

  // ── Step 2: Natural Transition after Greeting ──
  const handleTransitionFinished = useCallback(() => {
    setStartupStage('FIRST_QUESTION')
    const staged = stagedQuestionRef.current
    if (staged) {
      activateQuestion(staged)
    } else {
      setIsInterviewerThinking(true)
    }
  }, [activateQuestion])

  const handleGreetingFinished = useCallback(() => {
    setStartupStage('TRANSITION')
    const transitionText = "Alright, let's get started with your interview."
    const transitionId = `transition-${sessionId}`

    if (!isAudioMuted) {
      speak(transitionText, transitionId, false, () => {
        handleTransitionFinished()
      })
    } else {
      handleTransitionFinished()
    }
  }, [sessionId, isAudioMuted, speak, handleTransitionFinished])

  // Incoming question router (handles both WebSocket and REST hydration without race conditions)
  const handleIncomingQuestion = useCallback((q: InterviewQuestionResponse) => {
    const currentStage = startupStageRef.current
    if (currentStage === 'FIRST_QUESTION') {
      activateQuestion(q)
    } else if (currentStage === 'GREETING' || currentStage === 'TRANSITION' || currentStage === 'INITIALIZING') {
      // Hold question in staging until greeting and transition speech conclude!
      stagedQuestionRef.current = q
      setStagedQuestion(q)
    } else {
      // Normal INTERVIEW_ACTIVE: turn 2, 3, follow-ups
      activateQuestion(q)
    }
  }, [activateQuestion])

  // Sync REST-hydrated question to context without bypassing greeting
  useEffect(() => {
    if (fetchedQuestion?.questionStatus === 'PENDING') {
      handleIncomingQuestion(fetchedQuestion)
    }
  }, [fetchedQuestion, handleIncomingQuestion])

  // Redirect if session is completed and no pending evaluation modal
  useEffect(() => {
    if (
      (session?.status === 'COMPLETED' || session?.status === 'REPORT_GENERATED') &&
      !lastEvaluation
    ) {
      sessionStorage.removeItem('talentprep_active_session_id')
      if (sessionId) {
        sessionStorage.removeItem(`tp_room_joined_${sessionId}`)
      }
      navigate(`/interview/${sessionId}/report`, { replace: true })
    }
  }, [session?.status, sessionId, navigate, lastEvaluation])

  // ── 1. Hydrate Prior Transcript History on Mount (for page reload or resume) ──
  useEffect(() => {
    if (hasHydratedRef.current || !sessionId) return
    hasHydratedRef.current = true

    interviewApi
      .getTranscript(sessionId)
      .then((transcriptData) => {
        const transcriptItems = transcriptData.items || transcriptData.turns || []
        if (transcriptItems.length > 0) {
          // If previous turns exist, skip startup greeting sequence directly to active
          setStartupStage('INTERVIEW_ACTIVE')
          const loaded: ConversationMessage[] = []
          transcriptItems.forEach((item, idx) => {
            if (item.questionText) {
              const qId = item.questionId || `hist-q-${idx}`
              lastSpokenQuestionIdRef.current = qId
              loaded.push({
                id: qId,
                sender: 'ai',
                text: item.questionText,
                timestamp: 'Turn ' + (item.questionOrder || idx + 1),
                kind: 'question',
                questionId: item.questionId,
                questionOrder: item.questionOrder,
                topic: item.questionCategory,
                isFollowUp: item.isFollowUp,
              })
            }
            if (item.answerText) {
              loaded.push({
                id: `hist-ans-${item.questionId || idx}`,
                sender: 'candidate',
                text: item.answerText,
                timestamp: 'Answered',
                kind: 'answer',
              })
            }
          })
          setMessages(loaded)
        }
      })
      .catch((err) => {
        console.warn('Could not hydrate prior chat history:', err)
      })
  }, [sessionId])

  // ── Authoritative REST reconciliation on WebSocket reconnect ──
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
            handleIncomingQuestion(currentState.currentQuestion)
          } else if (currentState && !currentState.currentQuestion) {
            queryClient.setQueryData(interviewKeys.question(sessionId), null)
            setActiveQuestion(null)
          }
        } catch {
          // Current state is read-only authoritative source
        }
      } else if (freshSession.status === 'ROUND_TRANSITION') {
        setActiveQuestion(null)
      }
    } catch (err) {
      setErrorMessage(
        getErrorMessage(err) ||
          'Reconnected, but failed to sync latest session state. Please refresh if needed.'
      )
    }
  }, [sessionId, queryClient, setActiveQuestion, setIsEvaluating])

  const sendCommandRef = useRef<((payload: { type: InterviewCommandType; [k: string]: any }) => string) | null>(null)

  // ── Handle all STOMP WebSocket Events ──
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
            handleIncomingQuestion(firstQuestion)
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
            handleIncomingQuestion(nextQuestion)
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
          setIsInterviewerThinking(false)

          // If feedback is received, store last evaluation for modal or review
          if (evalResult) {
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
          setIsInterviewerThinking(false)
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

        case 'INTERVIEW_COMPLETED': {
          setIsEvaluating(false)
          setPendingCommand(null)
          setIsInterviewerThinking(false)
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
            if (sessionId) {
              sessionStorage.removeItem(`tp_room_joined_${sessionId}`)
            }
            queryClient.invalidateQueries({ queryKey: interviewKeys.session(sessionId) })
            navigate(`/interview/${sessionId}/report`, { replace: true })
          }
          break
        }

        case 'COMMAND_FAILED':
          setIsEvaluating(false)
          setPendingCommand(null)
          setIsInterviewerThinking(false)
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

  // ── Session Countdown Expiry ──
  const expiryHandledRef = useRef(false)
  useEffect(() => {
    if (!sessionId || session?.status !== 'IN_PROGRESS' || !session?.startedAt) return
    if (remainingSeconds > 0 || expiryHandledRef.current || isEvaluating) return

    expiryHandledRef.current = true
    if (isConnected && !isReconciling && sendCommandRef.current) {
      try {
        sendCommandRef.current({ type: 'END_INTERVIEW' })
        return
      } catch {
        // Fallback to REST
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
          getErrorMessage(err) || 'Interview duration elapsed. Please end session to view your report.'
        )
      })
  }, [sessionId, session?.status, session?.startedAt, remainingSeconds, isEvaluating, isConnected, isReconciling, queryClient])

  // Helper: Send live STOMP command
  const sendLiveCommand = (
    payload: Parameters<typeof sendCommand>[0],
    fallbackError: string
  ): boolean => {
    if (!sessionId) return false
    if (!isConnected || isReconciling) {
      setErrorMessage('Live interview connection is syncing. Please wait a moment.')
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

  // ── Handler: Device Setup Complete -> Enter Room & Greet ──
  const handleStartFromDeviceSetup = async (settings: {
    stream: MediaStream | null
    cameraEnabled: boolean
    micEnabled: boolean
    speakerEnabled: boolean
  }) => {
    // Prevent status hydration from treating this fresh session as a resumed one.
    startedFromDeviceSetupRef.current = true
    // 1. Unlock browser audio synthesis via candidate interaction
    unlockAudio()

    // Register active video tracks into activeVideoTracksRef
    if (settings.stream) {
      settings.stream.getVideoTracks().forEach((track) => {
        if (settings.cameraEnabled && track.readyState === 'live') {
          activeVideoTracksRef.current.add(track)
        } else {
          try {
            track.enabled = false
            track.stop()
          } catch {}
        }
      })
    }

    setMediaStream(settings.stream)
    mediaStreamRef.current = settings.stream
    setIsCameraEnabled(settings.cameraEnabled)
    setIsMicEnabled(settings.micEnabled)
    setIsAudioMuted(!settings.speakerEnabled)
    setHasJoinedRoom(true)

    if (sessionId) {
      sessionStorage.setItem(`tp_room_joined_${sessionId}`, 'true')
    }

    // 2. Natural AI Greeting and introductory dialogue
    setStartupStage('GREETING')
    const currentRound = session?.rounds?.[session?.currentRoundIndex || 0]
    const roundTitle = formatRoundTitle(currentRound?.roundType || 'TECHNICAL')
    const greetingText = `Hi ${candidateName}! Welcome to your virtual ${roundTitle} interview. I'm glad to have you here today. Take your time with your answers, and let's have a comfortable conversation.`
    const greetingId = `greeting-${sessionId}`

    // Add greeting to conversation
    setMessages((prev) => {
      if (prev.some((m) => m.id === greetingId || m.kind === 'greeting')) return prev
      return [
        ...prev,
        {
          id: greetingId,
          sender: 'ai',
          text: greetingText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          kind: 'greeting',
        },
      ]
    })

    // Speak greeting aloud immediately and trigger handleGreetingFinished upon completion
    if (settings.speakerEnabled && !greetingSpokenRef.current) {
      greetingSpokenRef.current = true
      speak(greetingText, greetingId, false, () => {
        handleGreetingFinished()
      })
    } else {
      greetingSpokenRef.current = true
      handleGreetingFinished()
    }

    // If session is still CREATED, initiate session start on backend
    if (session?.status === 'CREATED') {
      setIsInterviewerThinking(true)
      sendLiveCommand({ type: 'START_INTERVIEW' }, 'Failed to start interview session.')
    }
  }

  // ── Shared Answer Submission Pipeline ──
  const handleSharedSubmitAnswer = async (answerText: string) => {
    if (!sessionId || !activeQuestion || !answerText.trim() || isEvaluating) return

    stopListening()
    cancelSpeech()
    resetTranscript()
    setIsEvaluating(true)
    setIsInterviewerThinking(true)
    setErrorMessage(null)

    const submittedText = answerText.trim()
    setInputText('')

    // Append candidate message immediately into conversation
    setMessages((prev) => [
      ...prev,
      {
        id: `ans-${activeQuestion.questionId}-${Date.now()}`,
        sender: 'candidate',
        text: submittedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kind: 'answer',
      },
    ])

    try {
      const clientReqId =
        clientRequestIdRef.current ||
        `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      await interviewApi.submitAnswer(sessionId, {
        questionId: activeQuestion.questionId,
        answerText: submittedText,
        timeTakenSeconds: elapsedQuestionSeconds,
        clientRequestId: clientReqId,
      })

      clientRequestIdRef.current = null
      clearDraft()
    } catch (err: unknown) {
      setIsEvaluating(false)
      setIsInterviewerThinking(false)
      const msg = getErrorMessage(err)
      setErrorMessage(msg || 'Failed to submit answer. Please retry.')
      setInputText(submittedText)
    }
  }

  // ── Coding Round Handlers ──
  const handleRunCode = async (language: string, code: string): Promise<CodeRunResult | null> => {
    if (!sessionId || !activeQuestion) return null
    try {
      const res = await runCodeMutation.mutateAsync({
        questionId: activeQuestion.questionId,
        language,
        code,
      })
      return res
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || 'Code execution service is currently offline.'
      return {
        compiled: false,
        compilationOutput: msg,
        errorMessage: msg,
        passedAllTestCases: false,
        passedCount: 0,
        totalCount: 0,
        executionTimeMs: 0,
        memoryUsedBytes: 0,
        verdict: 'ERROR',
        testCaseResults: [],
      }
    }
  }

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

      // Add candidate code submission to conversation
      setMessages((prev) => [
        ...prev,
        {
          id: `code-sub-${Date.now()}`,
          sender: 'candidate',
          text: `Submitted solution in ${language.toUpperCase()}:\n\`\`\`${language}\n${code}\n\`\`\``,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          kind: 'answer',
        },
      ])
    } catch (err: unknown) {
      console.error('Code evaluation error:', err)
      setErrorMessage(getErrorMessage(err) || 'Code evaluation failed. Please retry submission.')
    } finally {
      setIsEvaluating(false)
    }
  }

  // ── Continue After Evaluation Modal ──
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

    const sent = sendLiveCommand({ type: 'NEXT_QUESTION' }, 'Failed to fetch the next question.')
    if (sent) {
      setActiveQuestion(null)
    } else {
      try {
        const nextQ = await interviewApi.getNextQuestion(sessionId!)
        if (nextQ && nextQ.questionStatus === 'PENDING') {
          queryClient.setQueryData(interviewKeys.question(sessionId), nextQ)
          setActiveQuestion(nextQ)
          resetQuestionTimer()
        } else {
          setActiveQuestion(null)
        }
      } catch (e) {
        console.error('Failed to get next question via REST:', e)
      }
    }
  }

  // ── Session Controls ──
  const handlePauseSession = () => {
    cancelSpeech()
    stopListening()
    sendLiveCommand({ type: 'PAUSE_INTERVIEW' }, 'Failed to pause interview.')
  }

  const handleResumeSession = () => {
    sendLiveCommand({ type: 'RESUME_INTERVIEW' }, 'Failed to resume interview.')
  }

  const handleEndInterview = () => {
    cancelSpeech()
    stopListening()
    const tracksToStop = new Set<MediaStreamTrack>([
      ...activeVideoTracksRef.current,
      ...(mediaStreamRef.current?.getTracks() || []),
      ...(mediaStream?.getTracks() || []),
    ])
    tracksToStop.forEach((track) => {
      try {
        track.enabled = false
        track.stop()
      } catch {}
    })
    activeVideoTracksRef.current.clear()
    mediaStreamRef.current = null
    setMediaStream(null)
    setIsCameraEnabled(false)
    setIsMicEnabled(false)
    sendLiveCommand({ type: 'END_INTERVIEW' }, 'Failed to end session.')
  }

  // Clean up media streams and speech on unmount
  useEffect(() => {
    return () => {
      cancelSpeechRef.current?.()
      stopListeningRef.current?.()
      const tracksToStop = new Set<MediaStreamTrack>([
        ...activeVideoTracksRef.current,
        ...(mediaStreamRef.current?.getTracks() || []),
      ])
      tracksToStop.forEach((track) => {
        try {
          track.enabled = false
          track.stop()
        } catch {}
      })
      activeVideoTracksRef.current.clear()
      mediaStreamRef.current = null
    }
  }, [])

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: PRE-INTERVIEW DEVICE SETUP
  // ─────────────────────────────────────────────────────────────
  if (!hasJoinedRoom) {
    return (
      <div className="flex-1 w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#080908]">
        <InterviewDeviceSetup
          session={session!}
          candidateName={candidateName}
          onStartInterview={handleStartFromDeviceSetup}
          isStarting={isStarting}
        />
      </div>
    )
  }

  const isCodingRound = activeQuestion?.roundType === 'CODING'
  const isSystemDesignRound = activeQuestion?.roundType === 'SYSTEM_DESIGN'

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: HYBRID AI VIDEO INTERVIEW ROOM (35% Left / 65% Right)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-[#FAFAFA] dark:bg-[#080908] text-foreground select-text font-sans">
      {/* ── Top Header Navigation Bar ── */}
      <InterviewRoomHeader
        session={session!}
        activeRoundType={activeQuestion?.roundType}
        remainingSeconds={remainingSeconds}
        connectionStatus={connectionStatus}
        statusDetail={statusDetail}
        isCameraEnabled={isCameraEnabled}
        isMicEnabled={isMicEnabled}
        isAudioMuted={isAudioMuted}
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        onToggleAudioMute={() => {
          setIsAudioMuted((prev) => {
            if (!prev) cancelSpeech()
            return !prev
          })
        }}
        isPaused={session?.status === 'PAUSED'}
        isEnding={isEnding}
        isDisabled={!isConnected || isReconciling || pendingCommand !== null}
        onPause={handlePauseSession}
        onResume={handleResumeSession}
        onEndInterview={handleEndInterview}
        onReconnect={() => void reconnect()}
      />

      {/* ── PAUSE OVERLAY ── */}
      {session?.status === 'PAUSED' && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-lg text-foreground">
                Interview Session Paused
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your countdown timer and question progress are suspended. Click resume when you are ready to continue.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResumeSession}
              disabled={!isConnected || isReconciling}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm transition-all"
            >
              Resume Interview
            </button>
          </div>
        </div>
      )}

      {/* ── Main Workspace Body (Two Columns Split) ── */}
      <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden">
        {/* ───────────────────────────────────────────────────────────
            LEFT SECTION: 35% Width – Stacked Video Panels
        ─────────────────────────────────────────────────────────── */}
        <aside className="w-full md:w-[35%] md:min-w-[300px] md:max-w-[420px] h-auto md:h-full flex-shrink-0 bg-secondary-bg/30 border-r border-border p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          {/* Top Panel: AI Interviewer */}
          <AIInterviewerPanel
            avatarState={avatarState}
            isAudioMuted={isAudioMuted}
          />

          {/* Bottom Panel: Candidate Camera */}
          <CandidateVideoPanel
            mediaStream={mediaStream}
            isCameraEnabled={isCameraEnabled}
            isMicEnabled={isMicEnabled}
            candidateName={candidateName}
            onToggleCamera={handleToggleCamera}
            onToggleMic={handleToggleMic}
            isSpeaking={isCandidateSpeaking}
          />
        </aside>

        {/* ───────────────────────────────────────────────────────────
            RIGHT SECTION: 65% Width – Primary Interview Workspace
        ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 w-full h-full flex flex-col overflow-hidden bg-card">
          {/* Coding Round Workspace */}
          {isCodingRound && activeQuestion ? (
            <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
              {/* Coding Round Workspace Tabs */}
              <div className="h-10 border-b border-border bg-secondary-bg/40 px-3 flex items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCodingActiveTab('code')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      codingActiveTab === 'code'
                        ? 'bg-card text-blue-600 shadow-2xs border border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary-bg'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Monaco Code Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodingActiveTab('conversation')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      codingActiveTab === 'conversation'
                        ? 'bg-card text-blue-600 shadow-2xs border border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary-bg'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Interviewer Conversation ({messages.length})</span>
                  </button>
                </div>
              </div>

              {/* View Tab Body */}
              <div className="flex-1 w-full overflow-hidden">
                {codingActiveTab === 'code' ? (
                  <CodingInterviewWorkspace
                    question={activeQuestion}
                    codeText={
                      codingAnswers[activeQuestion.questionId] ??
                      activeQuestion.codingStarterTemplates?.['java'] ??
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
                    session={session}
                    remainingSeconds={remainingSeconds}
                    connectionStatus={connectionStatus}
                    statusDetail={statusDetail}
                    onPause={handlePauseSession}
                    onResume={handleResumeSession}
                    isPaused={false}
                    isEnding={isEnding}
                    isControlsDisabled={!isConnected || isReconciling || pendingCommand !== null}
                    errorMessage={errorMessage}
                    onDismissError={() => setErrorMessage(null)}
                    hideHeader={true}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col overflow-hidden">
                    <InterviewConversation
                      messages={messages}
                      interimTranscript={interimTranscript}
                      isCandidateSpeaking={isCandidateSpeaking}
                      isThinking={isInterviewerThinking || isEvaluating}
                      candidateName={candidateName}
                      interviewerName="Interviewer"
                    />
                    <InterviewInputBar
                      inputText={inputText}
                      onChangeInput={(val) => {
                        setInputText(val)
                        setTranscript(val)
                      }}
                      onSubmit={() => handleSharedSubmitAnswer(inputText)}
                      isSubmitting={isEvaluating}
                      isThinking={isInterviewerThinking}
                      isListening={isListening}
                      isCandidateSpeaking={isCandidateSpeaking}
                      onStartListening={() => {
                        cancelSpeech()
                        setTranscript(inputText)
                        void startListening()
                      }}
                      onStopListening={stopListening}
                      isSttSupported={isSttSupported}
                      errorMessage={errorMessage}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Non-Coding Rounds: Conversational Interface (Technical, System Design, HR) */
            <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
              {/* Optional System Design Whiteboard Drawer */}
              {isSystemDesignRound && (
                <div className="p-3 border-b border-border bg-secondary-bg/20 flex-shrink-0">
                  <SystemDesignWorkspace
                    isOpen={isWhiteboardOpen}
                    onToggle={() => setIsWhiteboardOpen((prev) => !prev)}
                    onAppendToAnswer={(summary) => {
                      setInputText((prev) => (prev ? `${prev}\n\n${summary}` : summary))
                    }}
                  />
                </div>
              )}

              {/* Continuous Conversation Feed */}
              <InterviewConversation
                messages={messages}
                interimTranscript={interimTranscript}
                isCandidateSpeaking={isCandidateSpeaking}
                isThinking={isInterviewerThinking || isEvaluating}
                candidateName={candidateName}
                interviewerName="Interviewer"
              />

              {/* Unified Voice and Text Input Bar */}
              <InterviewInputBar
                inputText={inputText}
                onChangeInput={(val) => {
                  setInputText(val)
                  setTranscript(val)
                }}
                onSubmit={() => handleSharedSubmitAnswer(inputText)}
                isSubmitting={isEvaluating}
                isThinking={isInterviewerThinking}
                isListening={isListening}
                isCandidateSpeaking={isCandidateSpeaking}
                onStartListening={() => {
                  cancelSpeech()
                  setTranscript(inputText)
                  void startListening()
                }}
                onStopListening={stopListening}
                isSttSupported={isSttSupported}
                errorMessage={errorMessage}
              />
            </div>
          )}
        </main>
      </div>

      {/* ── Round Transition Modal ── */}
      {session?.status === 'ROUND_TRANSITION' && (
        <RoundTransitionModal
          completedRound={session.rounds?.[session.currentRoundIndex || 0]}
          nextRound={session.rounds?.[(session.currentRoundIndex || 0) + 1]}
          onStartNextRound={() => {
            sendLiveCommand({ type: 'NEXT_QUESTION' }, 'Failed to advance to next round.')
          }}
          isLoading={isLoadingNext}
        />
      )}

      {/* ── Evaluation Feedback Modal ── */}
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
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">
          Connecting to Interview Session...
        </p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="font-heading font-bold text-base text-foreground">
          Session Not Found or Access Denied
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
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
