import React from 'react'
import {
  Send,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react'
import type { InterviewQuestionResponse } from '../types/interview.types'
import { formatRoundTitle } from '../utils/interviewFormatters'

interface TextInterviewWorkspaceProps {
  question: InterviewQuestionResponse
  answerText: string
  onChangeAnswer: (val: string) => void
  onSubmitAnswer: () => void
  isSubmitting: boolean
  elapsedSeconds: number
}

export default function TextInterviewWorkspace({
  question,
  answerText,
  onChangeAnswer,
  onSubmitAnswer,
  isSubmitting,
  elapsedSeconds,
}: TextInterviewWorkspaceProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (answerText.trim() && !isSubmitting) {
        onSubmitAnswer()
      }
    }
  }

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0
  const charCount = answerText.length

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="space-y-4">
      {/* ── Question Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatRoundTitle(question.roundType)}</span>
            </span>

            {question.questionCategory && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {question.questionCategory}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums">{formatElapsed(elapsedSeconds)}</span>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {question.questionText}
        </h3>
      </div>

      {/* ── Answer Editor Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Your Response
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        <textarea
          rows={8}
          value={answerText}
          onChange={(e) => onChangeAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Articulate your structured answer here... Use concrete trade-offs, architecture patterns, or examples."
          disabled={isSubmitting}
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors leading-relaxed resize-y disabled:opacity-50"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px]">Enter</kbd> to submit
            </span>
          </div>

          <button
            type="button"
            onClick={onSubmitAnswer}
            disabled={!answerText.trim() || isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Response</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
