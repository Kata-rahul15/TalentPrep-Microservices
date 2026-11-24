import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Send,
  Clock,
  Mic,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  CornerDownRight,
} from 'lucide-react'
import type { InterviewQuestionResponse } from '../types/interview.types'
import { interviewApi } from '../api/interviewApi'
import { formatRoundTitle } from '../utils/interviewFormatters'

export interface ChatMessage {
  id: string
  sender: 'interviewer' | 'candidate'
  text: string
  timestamp: string
  isFollowUp?: boolean
  depth?: number
  topic?: string | null
  category?: string | null
  questionOrder?: number
}

interface ChatTurn {
  questionId: string
  questionText: string
  answerText?: string | null
  isFollowUp?: boolean
  depth?: number
  topic?: string | null
  questionOrder?: number
  timestamp?: string
}

interface ChatInterviewWorkspaceProps {
  question: InterviewQuestionResponse
  sessionId: string
  onSubmitAnswer: (answerText: string, clientRequestId?: string) => Promise<void>
  onSwitchToVoice: () => void
  isSubmitting: boolean
  isThinking: boolean
  elapsedSeconds: number
  wsConnected: boolean
}

export default function ChatInterviewWorkspace({
  question,
  sessionId,
  onSubmitAnswer,
  onSwitchToVoice,
  isSubmitting,
  isThinking,
  elapsedSeconds,
  wsConnected,
}: ChatInterviewWorkspaceProps) {
  // 1. Completed historical turns loaded from transcript
  const [historyTurns, setHistoryTurns] = useState<ChatTurn[]>([])

  // 2. Turns submitted locally during the active session (questionId -> answerText)
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string>>({})

  const [inputText, setInputText] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const clientRequestIdRef = useRef<string | null>(null)
  const hasHydratedRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const getClientRequestId = useCallback(() => {
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }
    return clientRequestIdRef.current
  }, [])

  // 1. Initial transcript hydration on mount
  useEffect(() => {
    if (hasHydratedRef.current || !sessionId) return
    hasHydratedRef.current = true

    interviewApi
      .getTranscript(sessionId)
      .then((transcriptData) => {
        const transcriptItems = transcriptData.items || transcriptData.turns || []
        if (transcriptItems.length > 0) {
          const loaded: ChatTurn[] = []
          transcriptItems.forEach((item, idx) => {
            if (item.questionText) {
              loaded.push({
                questionId: item.questionId || `hist-q-${idx}`,
                questionText: item.questionText,
                answerText: item.answerText,
                isFollowUp: item.isFollowUp,
                topic: item.questionCategory,
                questionOrder: item.questionOrder,
                timestamp: 'Completed',
              })
            }
          })
          setHistoryTurns(loaded)
        }
      })
      .catch((err) => {
        console.warn('Could not hydrate prior chat history:', err)
      })
  }, [sessionId])

  // Focus textarea when new question arrives
  useEffect(() => {
    if (!isThinking && !isSubmitting && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [question?.questionId, isThinking, isSubmitting])

  // Submit candidate answer
  const handleSubmit = async () => {
    const textToSubmit = inputText.trim()
    if (!textToSubmit || isSubmitting || isThinking) return

    setErrorMsg(null)
    setInputText('')

    const qId = question.questionId
    setSubmittedAnswers((prev) => ({
      ...prev,
      [qId]: textToSubmit,
    }))

    try {
      await onSubmitAnswer(textToSubmit, getClientRequestId())
      clientRequestIdRef.current = null
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send answer. Please retry.'
      setErrorMsg(msg)
      setInputText(textToSubmit)
      setSubmittedAnswers((prev) => {
        const next = { ...prev }
        delete next[qId]
        return next
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
    }
  }

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins}:${s < 10 ? '0' : ''}${s}`
  }

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0
  const charCount = inputText.length

  // Filter prior completed turns
  const priorCompletedTurns = useMemo(() => {
    return historyTurns.filter((turn) => turn.questionId !== question.questionId)
  }, [historyTurns, question.questionId])

  return (
    <div className="w-full space-y-4">
      {/* ── Question Context Header Bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground bg-muted border border-border/80 px-2.5 py-1 rounded-md">
            {formatRoundTitle(question.roundType)}
          </span>

          <span className="text-xs font-mono tabular-nums text-muted-foreground bg-secondary-bg border border-border/70 px-2 py-0.5 rounded-md">
            Question {question.questionOrder} of {question.targetQuestionCount}
          </span>

          {question.topic && (
            <span className="text-xs text-foreground font-medium">
              {question.topic}
            </span>
          )}

          {question.isFollowUp && (
            <span className="text-[11px] font-mono text-[#080908] bg-[#CDF22B]/20 border border-[#CDF22B]/40 px-2 py-0.5 rounded-md">
              Follow-up {question.depth ? `(depth ${question.depth})` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {wsConnected && (
            <span className="w-2 h-2 rounded-full bg-[#CDF22B] border border-[#080908]/20" title="Live sync connected" />
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>Turn: {formatElapsed(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={onSwitchToVoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary-bg transition-colors cursor-pointer"
            title="Switch from Chat to Voice interaction mode"
          >
            <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Switch to Voice</span>
          </button>
        </div>
      </div>

      {/* ── Active Question Presentation Surface ── */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Interviewer Prompt
          </span>
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            Turn {String(question.questionOrder).padStart(2, '0')}
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-base sm:text-lg text-foreground leading-relaxed font-normal whitespace-pre-wrap">
            {question.questionText}
          </p>
        </div>
      </div>

      {/* ── Prior Turns Accordion (if any) ── */}
      {priorCompletedTurns.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary-bg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Previous questions ({priorCompletedTurns.length})</span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showHistory && (
            <div className="px-5 pb-4 pt-1 space-y-4 border-t border-border">
              {priorCompletedTurns.map((turn, i) => (
                <div key={turn.questionId || i} className="space-y-2 text-xs pt-3 first:pt-1">
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                    <span>Q{turn.questionOrder || i + 1}</span>
                    <span>•</span>
                    <span>{turn.topic || 'General'}</span>
                  </div>
                  <p className="text-foreground font-medium">
                    {turn.questionText}
                  </p>
                  {turn.answerText && (
                    <div className="flex items-start gap-2 pl-3 border-l-2 border-[#080908] text-muted-foreground">
                      <CornerDownRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="whitespace-pre-wrap text-foreground/90">{turn.answerText}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Thinking / Evaluation Indicator ── */}
      {isThinking && (
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#080908] border-t-[#CDF22B] rounded-full animate-spin flex-shrink-0" />
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-foreground">
              Evaluating response and preparing next question
            </p>
            <p className="text-muted-foreground">
              Multi-dimensional analysis running via async worker.
            </p>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-card border border-destructive/40 flex items-start gap-2.5 text-destructive text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {(isSubmitting || isThinking) && submittedAnswers[question.questionId] && (
        <div className="p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground font-mono">
          <span className="text-muted-foreground/70 select-none">Submitted: </span>
          {submittedAnswers[question.questionId].slice(0, 140)}...
        </div>
      )}

      {/* ── Answer Composer ── */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Candidate Response
          </span>
          <span className="font-mono tabular-nums text-[11px]">
            {wordCount} words • {charCount} chars
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting || isThinking}
          rows={6}
          placeholder="Structure your answer with trade-offs, architecture decisions, and code rationale..."
          className="w-full p-3.5 rounded-lg border border-border bg-secondary-bg/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#080908] focus:border-[#080908] leading-relaxed resize-y disabled:opacity-50"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground hidden sm:inline font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">Enter</kbd> to submit
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                disabled={isSubmitting || isThinking}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!inputText.trim() || isSubmitting || isThinking}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CDF22B] hover:bg-[#b8da25] active:bg-[#a6c521] disabled:opacity-50 disabled:cursor-not-allowed text-[#080908] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#080908] border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
