import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  Send,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Radio,
  CheckCircle2,
} from 'lucide-react'
import type { InterviewQuestionResponse } from '../types/interview.types'
import type { VoiceInterviewState } from '../types/voiceStateMachine.types'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { formatRoundTitle } from '../utils/interviewFormatters'

interface VoiceInterviewWorkspaceProps {
  question: InterviewQuestionResponse
  onSubmitAnswer: (answerText: string, clientRequestId?: string) => Promise<void>
  onSwitchToChat?: () => void
  onSwitchToText?: () => void
  isSubmitting: boolean
  isThinking: boolean
  elapsedSeconds: number
  wsConnected: boolean
}

export default function VoiceInterviewWorkspace({
  question,
  onSubmitAnswer,
  onSwitchToChat,
  onSwitchToText,
  isSubmitting,
  isThinking,
  elapsedSeconds,
  wsConnected,
}: VoiceInterviewWorkspaceProps) {
  const handleSwitchToChat = onSwitchToChat || onSwitchToText

  // State machine tracking
  const [localVoiceState, setLocalVoiceState] = useState<VoiceInterviewState>('INTERVIEWER_SPEAKING')
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const clientRequestIdRef = useRef<string | null>(null)

  const getClientRequestId = useCallback(() => {
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }
    return clientRequestIdRef.current
  }, [])

  // Speech Recognition (Candidate STT)
  const {
    finalTranscript,
    interimTranscript,
    liveTranscript,
    isListening,
    isSpeaking: isCandidateSpeaking,
    isSupported: isSttSupported,
    permissionStatus,
    error: sttError,
    charCount,
    wordCount,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useSpeechRecognition('en-IN')

  // Speech Synthesis callbacks
  const handleTtsStart = useCallback(() => {
    setLocalVoiceState('INTERVIEWER_SPEAKING')
  }, [])

  const handleTtsEnd = useCallback(() => {
    setLocalVoiceState('LISTENING')
    void startListening()
  }, [startListening])

  // Speech Synthesis (Interviewer TTS)
  const {
    speak,
    cancel: cancelSpeech,
    replay: replaySpeech,
    isSpeaking: isInterviewerSpeaking,
    isSupported: isTtsSupported,
  } = useSpeechSynthesis(handleTtsEnd, handleTtsStart)

  const currentQuestionIdRef = useRef<string | null>(null)

  // Trigger TTS when active question changes
  useEffect(() => {
    if (!question || !question.questionText) return

    if (currentQuestionIdRef.current !== question.questionId) {
      currentQuestionIdRef.current = question.questionId
      clientRequestIdRef.current = null
      resetTranscript()
      setSubmissionError(null)

      if (isTtsSupported) {
        speak(question.questionText, question.questionId)
      } else {
        void startListening()
      }
    }
  }, [question, isTtsSupported, speak, resetTranscript, startListening])

  // Side-effect cleanup when thinking or submitting
  useEffect(() => {
    if (isThinking) {
      stopListening()
      cancelSpeech()
    } else if (isSubmitting) {
      stopListening()
    }
  }, [isThinking, isSubmitting, stopListening, cancelSpeech])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopListening()
      cancelSpeech()
    }
  }, [stopListening, cancelSpeech])

  // Unified voice state representation
  const voiceState: VoiceInterviewState = isThinking
    ? 'INTERVIEWER_THINKING'
    : isSubmitting
      ? 'ANSWER_SUBMITTING'
      : isInterviewerSpeaking
        ? 'INTERVIEWER_SPEAKING'
        : isListening
          ? 'LISTENING'
          : localVoiceState === 'INTERVIEWER_SPEAKING'
            ? 'INTERVIEWER_SPEAKING'
            : 'TRANSCRIPT_REVIEW'

  // Explicit user actions
  const handleStartListening = async () => {
    cancelSpeech()
    setSubmissionError(null)
    setLocalVoiceState('LISTENING')
    await startListening()
  }

  const handleStopListening = () => {
    stopListening()
    setLocalVoiceState('TRANSCRIPT_REVIEW')
  }

  const handleSkipSpeech = async () => {
    cancelSpeech()
    setLocalVoiceState('LISTENING')
    await startListening()
  }

  const handleRepeatQuestion = () => {
    stopListening()
    setLocalVoiceState('INTERVIEWER_SPEAKING')
    replaySpeech(question.questionText, question.questionId)
  }

  const handleRetryMicrophone = async () => {
    setSubmissionError(null)
    setLocalVoiceState('LISTENING')
    await startListening()
  }

  const handleSubmit = async () => {
    const fullAnswer = (finalTranscript || liveTranscript).trim()
    if (!fullAnswer) {
      setSubmissionError('Cannot submit an empty answer. Speak or type your response before submitting.')
      return
    }
    if (isSubmitting || isThinking) return

    stopListening()
    cancelSpeech()
    setSubmissionError(null)

    try {
      await onSubmitAnswer(fullAnswer, getClientRequestId())
    } catch (err: unknown) {
      setLocalVoiceState('TRANSCRIPT_REVIEW')
      const msg = err instanceof Error ? err.message : 'Submission failed. Please retry.'
      setSubmissionError(msg)
    }
  }

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="w-full space-y-4">
      {/* ── Context & Voice Controls Bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground bg-muted border border-border/80 px-2.5 py-1 rounded">
            {formatRoundTitle(question.roundType)}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#080908] bg-[#CDF22B] px-2 py-0.5 rounded font-bold">
            <Radio className="w-3 h-3 text-[#080908] animate-pulse" />
            Voice Mode (en-IN)
          </span>

          {question.topic && (
            <span className="text-xs text-foreground font-medium">
              {question.topic}
            </span>
          )}

          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            Q{question.questionOrder} of {question.targetQuestionCount}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>Turn: {formatSec(elapsedSeconds)}</span>
          </div>

          {handleSwitchToChat && (
            <button
              type="button"
              onClick={handleSwitchToChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary-bg transition-colors cursor-pointer"
              title="Switch from Voice to Chat interaction mode"
            >
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Switch to Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Question Presentation Card ── */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Interviewer Prompt (Audio)
            </span>
            {isInterviewerSpeaking && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground animate-pulse">
                <Volume2 className="w-3 h-3" />
                Speaking prompt...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRepeatQuestion}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded hover:bg-secondary-bg"
              title="Read the question aloud again"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Replay Question</span>
            </button>

            {isInterviewerSpeaking && (
              <button
                type="button"
                onClick={handleSkipSpeech}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded hover:bg-secondary-bg"
                title="Stop interviewer audio and start answering"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Skip Audio</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-base sm:text-lg text-foreground leading-relaxed font-normal whitespace-pre-wrap">
          {question.questionText}
        </p>
      </div>

      {/* ── Browser Compatibility Warning ── */}
      {!isSttSupported && (
        <div className="p-4 rounded-xl bg-card border border-border text-foreground text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-foreground">Web Speech API not supported in this browser</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time voice transcription requires the Web Speech API, which is supported in Google Chrome and Microsoft Edge on desktop. You can still type your answers by switching to Chat Mode.
            </p>
            {handleSwitchToChat && (
              <button
                type="button"
                onClick={handleSwitchToChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080908] hover:bg-[#1f211f] text-[#FAF8F3] font-medium text-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Switch to Chat Mode</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Audio State Machine Strip & Transcription Area ── */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        {/* Status indicator bar */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-border gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                voiceState === 'LISTENING'
                  ? 'bg-[#CDF22B] animate-ping'
                  : voiceState === 'INTERVIEWER_SPEAKING'
                    ? 'bg-[#080908] animate-pulse'
                    : voiceState === 'ANSWER_SUBMITTING' || voiceState === 'INTERVIEWER_THINKING'
                      ? 'bg-[#080908] animate-pulse'
                      : 'bg-[#CDF22B]'
              }`}
            />
            <span className="text-xs font-semibold text-foreground">
              {voiceState === 'INTERVIEWER_SPEAKING' && 'Interviewer is speaking prompt'}
              {voiceState === 'LISTENING' && 'Microphone active — Listening to your response...'}
              {voiceState === 'TRANSCRIPT_REVIEW' && 'Microphone paused — Review your transcribed response'}
              {voiceState === 'ANSWER_SUBMITTING' && 'Submitting candidate answer...'}
              {voiceState === 'INTERVIEWER_THINKING' && 'AI evaluating answer and preparing next question...'}
            </span>
          </div>

          {/* Animated audio waveform & microphone status */}
          <div className="flex items-center gap-3">
            {permissionStatus === 'granted' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-foreground">
                <CheckCircle2 className="w-3 h-3 text-[#080908]" />
                Mic Ready
              </span>
            )}

            {isListening && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#080908] text-[#FAF8F3]"
                title={isCandidateSpeaking ? 'Speech detected' : 'Microphone is open and waiting for speech'}
              >
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-4 bg-[#CDF22B] animate-bounce' : 'h-2 bg-[#CDF22B]/60 animate-pulse'
                  }`}
                />
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-6 bg-[#CDF22B] animate-bounce [animation-delay:100ms]' : 'h-3.5 bg-[#CDF22B]/60 animate-pulse [animation-delay:100ms]'
                  }`}
                />
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-3 bg-[#CDF22B] animate-bounce [animation-delay:200ms]' : 'h-2 bg-[#CDF22B]/60 animate-pulse [animation-delay:200ms]'
                  }`}
                />
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-5 bg-[#CDF22B] animate-bounce [animation-delay:150ms]' : 'h-3 bg-[#CDF22B]/60 animate-pulse [animation-delay:150ms]'
                  }`}
                />
                <span className="ml-1 text-[10px] font-mono font-bold text-[#CDF22B]">
                  {isCandidateSpeaking ? 'SPEAKING' : 'LISTENING'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Error Messages ── */}
        {sttError && (
          <div className="p-3.5 rounded-lg bg-card border border-destructive/40 text-destructive text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-medium">{sttError}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetryMicrophone}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080908] text-[#FAF8F3] font-medium text-xs hover:bg-[#1f211f] cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Microphone</span>
                </button>
                {handleSwitchToChat && (
                  <button
                    type="button"
                    onClick={handleSwitchToChat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border text-foreground font-medium text-xs hover:bg-secondary-bg cursor-pointer transition-colors"
                  >
                    <span>Switch to Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {submissionError && (
          <div className="p-3.5 rounded-lg bg-card border border-border text-foreground text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
            <p>{submissionError}</p>
          </div>
        )}

        {/* ── Live Interim Transcript Stream Pill ── */}
        {isListening && interimTranscript && (
          <div className="p-3 rounded-lg bg-secondary-bg border border-border text-foreground text-xs flex items-start gap-2">
            <Mic className="w-3.5 h-3.5 text-foreground flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] mr-1.5">
                Live Speech Stream:
              </span>
              <span className="italic font-normal">"{interimTranscript}"</span>
            </div>
          </div>
        )}

        {/* ── Live / Finalized Editable Transcript Area ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {isListening ? 'Finalized Transcript (Accumulating)' : 'Your Transcribed Answer (Editable)'}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {wordCount} words • {charCount} chars
            </span>
          </div>

          <textarea
            value={finalTranscript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... Speak into your microphone and your speech will appear here.'
                : 'Transcribed speech will appear here. You can also edit, modify, or type directly before submitting.'
            }
            rows={5}
            disabled={voiceState === 'ANSWER_SUBMITTING' || voiceState === 'INTERVIEWER_THINKING'}
            className="w-full p-3.5 rounded-lg border border-border bg-secondary-bg/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#080908] focus:border-[#080908] leading-relaxed resize-y transition-colors"
          />
        </div>

        {/* ── Control Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {/* Start / Resume Listening Button */}
            {!isListening && isSttSupported && (
              <button
                type="button"
                onClick={handleStartListening}
                disabled={voiceState === 'ANSWER_SUBMITTING' || voiceState === 'INTERVIEWER_THINKING'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#080908] hover:bg-[#1f211f] active:bg-black text-[#FAF8F3] font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Activate microphone and start recording your answer"
              >
                <Mic className="w-4 h-4 text-[#CDF22B]" />
                <span>{finalTranscript.trim() ? 'Resume Speaking' : 'Start Listening'}</span>
              </button>
            )}

            {/* Stop / Pause Listening Button */}
            {isListening && (
              <button
                type="button"
                onClick={handleStopListening}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-card border border-border hover:bg-secondary-bg text-foreground font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-colors"
                title="Stop listening and review or edit your transcribed response"
              >
                <MicOff className="w-4 h-4 text-muted-foreground" />
                <span>Stop Listening</span>
              </button>
            )}

            {/* Clear Transcript Button */}
            {(finalTranscript || interimTranscript) &&
              voiceState !== 'ANSWER_SUBMITTING' &&
              voiceState !== 'INTERVIEWER_THINKING' && (
                <button
                  type="button"
                  onClick={resetTranscript}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary-bg cursor-pointer transition-colors"
                  title="Clear the current transcript"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
          </div>

          {/* Submit Answer Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              (!finalTranscript.trim() && !liveTranscript.trim()) ||
              voiceState === 'ANSWER_SUBMITTING' ||
              voiceState === 'INTERVIEWER_THINKING' ||
              !wsConnected
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#CDF22B] hover:bg-[#b8da25] active:bg-[#a6c521] text-[#080908] font-bold text-xs sm:text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {voiceState === 'ANSWER_SUBMITTING' ? (
              <>
                <div className="w-4 h-4 border-2 border-[#080908] border-t-transparent rounded-full animate-spin" />
                <span>Submitting Answer...</span>
              </>
            ) : voiceState === 'INTERVIEWER_THINKING' ? (
              <>
                <div className="w-4 h-4 border-2 border-[#080908] border-t-transparent rounded-full animate-spin" />
                <span>AI Evaluating Answer...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Answer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
