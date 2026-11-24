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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
            {formatRoundTitle(question.roundType)}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 px-2 py-0.5 rounded">
            <Radio className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-pulse" />
            Voice Mode (en-IN)
          </span>

          {question.topic && (
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {question.topic}
            </span>
          )}

          <span className="text-xs font-mono text-slate-400">
            Q{question.questionOrder} of {question.targetQuestionCount}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Turn: {formatSec(elapsedSeconds)}</span>
          </div>

          {handleSwitchToChat && (
            <button
              type="button"
              onClick={handleSwitchToChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Switch from Voice to Chat interaction mode"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Switch to Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Question Presentation Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
              INTERVIEWER PROMPT (AUDIO)
            </span>
            {isInterviewerSpeaking && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                <Volume2 className="w-3 h-3" />
                Speaking question...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRepeatQuestion}
              className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Read the question aloud again"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Replay Question</span>
            </button>

            {isInterviewerSpeaking && (
              <button
                type="button"
                onClick={handleSkipSpeech}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Stop interviewer audio and start answering"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Skip Audio</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-relaxed font-normal whitespace-pre-wrap">
          {question.questionText}
        </p>
      </div>

      {/* ── Browser Compatibility Warning ── */}
      {!isSttSupported && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 space-y-2">
            <p className="font-medium">Web Speech API not supported in this browser</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Real-time voice transcription requires the Web Speech API, which is fully supported in Google Chrome, Chromium browsers, and Microsoft Edge on desktop. You can still type your answers by switching to Chat Mode.
            </p>
            {handleSwitchToChat && (
              <button
                type="button"
                onClick={handleSwitchToChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Switch to Chat Mode</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Audio State Machine Strip & Transcription Area ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        {/* Status indicator bar */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                voiceState === 'LISTENING'
                  ? 'bg-rose-500 animate-ping'
                  : voiceState === 'INTERVIEWER_SPEAKING'
                    ? 'bg-blue-500 animate-pulse'
                    : voiceState === 'ANSWER_SUBMITTING' || voiceState === 'INTERVIEWER_THINKING'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {voiceState === 'INTERVIEWER_SPEAKING' && 'Interviewer is speaking prompt'}
              {voiceState === 'LISTENING' && 'Microphone Active — Listening to your response...'}
              {voiceState === 'TRANSCRIPT_REVIEW' && 'Microphone Paused — Review your transcribed response'}
              {voiceState === 'ANSWER_SUBMITTING' && 'Submitting candidate answer...'}
              {voiceState === 'INTERVIEWER_THINKING' && 'AI Evaluating answer & preparing next question...'}
            </span>
          </div>

          {/* Animated audio waveform & microphone status */}
          <div className="flex items-center gap-3">
            {permissionStatus === 'granted' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Mic Ready
              </span>
            )}

            {isListening && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60"
                title={isCandidateSpeaking ? 'Speech detected' : 'Microphone is open and waiting for speech'}
              >
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-4 bg-rose-600 animate-bounce' : 'h-2 bg-rose-400 animate-pulse'
                  }`}
                />
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-6 bg-rose-600 animate-bounce [animation-delay:100ms]' : 'h-3.5 bg-rose-400 animate-pulse [animation-delay:100ms]'
                  }`}
                />
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-3 bg-rose-600 animate-bounce [animation-delay:200ms]' : 'h-2 bg-rose-400 animate-pulse [animation-delay:200ms]'
                  }`}
                />
                <span
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isCandidateSpeaking ? 'h-5 bg-rose-600 animate-bounce [animation-delay:150ms]' : 'h-3 bg-rose-400 animate-pulse [animation-delay:150ms]'
                  }`}
                />
                <span className="ml-1 text-[10px] font-mono font-medium text-rose-700 dark:text-rose-300">
                  {isCandidateSpeaking ? 'SPEAKING' : 'LISTENING'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Error Messages ── */}
        {sttError && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-medium">{sttError}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetryMicrophone}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Microphone</span>
                </button>
                {handleSwitchToChat && (
                  <button
                    type="button"
                    onClick={handleSwitchToChat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-300 text-rose-700 dark:text-rose-300 font-medium text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer transition-colors"
                  >
                    <span>Switch to Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {submissionError && (
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{submissionError}</p>
          </div>
        )}

        {/* ── Live Interim Transcript Stream Pill ── */}
        {isListening && interimTranscript && (
          <div className="p-3 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2 animate-fadeIn">
            <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <span className="font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[10px] mr-1.5">
                Live Speech Stream:
              </span>
              <span className="italic font-normal">"{interimTranscript}"</span>
            </div>
          </div>
        )}

        {/* ── Live / Finalized Editable Transcript Area ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isListening ? 'Finalized Transcript (Accumulating)' : 'Your Transcribed Answer (Editable)'}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
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
            className="w-full p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed resize-y transition-colors"
          />
        </div>

        {/* ── Control Action Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {/* Start / Resume Listening Button */}
            {!isListening && isSttSupported && (
              <button
                type="button"
                onClick={handleStartListening}
                disabled={voiceState === 'ANSWER_SUBMITTING' || voiceState === 'INTERVIEWER_THINKING'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Activate microphone and start recording your answer"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>{finalTranscript.trim() ? 'Resume Speaking' : 'Start Listening'}</span>
              </button>
            )}

            {/* Stop / Pause Listening Button */}
            {isListening && (
              <button
                type="button"
                onClick={handleStopListening}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-colors"
                title="Stop listening and review or edit your transcribed response"
              >
                <MicOff className="w-4 h-4 text-white" />
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
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs sm:text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {voiceState === 'ANSWER_SUBMITTING' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Answer...</span>
              </>
            ) : voiceState === 'INTERVIEWER_THINKING' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
