import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { AnswerEvaluationResponseDto } from '../types/interview.types'
import ScoreRing from '@/features/resume/components/ScoreRing'
import ScoreBar from '@/features/resume/components/ScoreBar'

interface EvaluationFeedbackModalProps {
  evaluation: AnswerEvaluationResponseDto
  onContinue: () => void
}

export default function EvaluationFeedbackModal({
  evaluation,
  onContinue,
}: EvaluationFeedbackModalProps) {
  const [showIdealAnswer, setShowIdealAnswer] = useState(false)

  const isHighPerformance = evaluation.score >= 75
  const isPassing = evaluation.score >= 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080908]/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-7 space-y-5 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Turn Evaluation
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-0.5">
              {isHighPerformance
                ? 'Strong Response'
                : isPassing
                  ? 'Solid Answer'
                  : 'Needs Enhancement'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <ScoreRing score={evaluation.score} size="md" label="pts" />
          </div>
        </div>

        {/* Deterministic Execution Metrics (for Coding Submissions) */}
        {evaluation.passedCount !== undefined && evaluation.totalCount !== undefined && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-secondary-bg/80 border border-border">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                evaluation.passedCount === evaluation.totalCount && evaluation.totalCount > 0
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {evaluation.passedCount === evaluation.totalCount && evaluation.totalCount > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{evaluation.verdict || (evaluation.passedCount === evaluation.totalCount ? 'ACCEPTED' : 'TESTS_FAILED')}</span>
              </span>
              <span className="text-xs font-mono font-medium text-foreground">
                Passed {evaluation.passedCount} / {evaluation.totalCount} test cases
              </span>
            </div>
            {evaluation.executionTimeMs !== undefined && (
              <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-card border border-border">
                Runtime: {evaluation.executionTimeMs} ms
              </span>
            )}
          </div>
        )}

        {/* General Feedback Quote */}
        {evaluation.feedback && (
          <div className="bg-secondary-bg/60 rounded-xl p-4 border border-border text-xs sm:text-sm text-foreground leading-relaxed">
            {evaluation.feedback}
          </div>
        )}

        {/* 4 Dimension Score Bars */}
        <div className="space-y-3 bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Competency Dimensions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <ScoreBar
              score={evaluation.technicalAccuracy}
              label="Technical Accuracy"
            />
            <ScoreBar
              score={evaluation.completeness}
              label="Completeness"
            />
            <ScoreBar
              score={evaluation.clarity}
              label="Clarity & Delivery"
            />
            <ScoreBar
              score={evaluation.problemSolving}
              label="Problem Solving"
            />
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-secondary-bg/60 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-foreground" />
              <span>Key Strengths</span>
            </div>
            {evaluation.strengths && evaluation.strengths.length > 0 ? (
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {evaluation.strengths.map((str, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {str}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">None highlighted for this question.</p>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-secondary-bg/60 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span>Areas for Improvement</span>
            </div>
            {evaluation.improvements && evaluation.improvements.length > 0 ? (
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {evaluation.improvements.map((imp, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {imp}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No major weaknesses identified.</p>
            )}
          </div>
        </div>

        {/* Suggested Ideal Answer (Collapsible) */}
        {evaluation.suggestedIdealAnswer && (
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowIdealAnswer((prev) => !prev)}
              className="w-full flex items-center justify-between p-3.5 bg-secondary-bg/60 hover:bg-secondary-bg transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <BookOpen className="w-4 h-4 text-foreground" />
                <span>Reference Model Answer</span>
              </div>
              {showIdealAnswer ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showIdealAnswer && (
              <div className="p-4 bg-card border-t border-border text-xs sm:text-[13px] text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                {evaluation.suggestedIdealAnswer}
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#CDF22B] hover:bg-[#b8da25] text-[#080908] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <span>
              {evaluation.interviewCompleted
                ? 'Finish Interview & View Report'
                : evaluation.roundCompleted
                  ? 'Complete Round'
                  : 'Continue to Next Question'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
