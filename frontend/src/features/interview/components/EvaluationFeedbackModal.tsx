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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-7 space-y-5 my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Turn Evaluation
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
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

        {/* General Feedback Quote */}
        {evaluation.feedback && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {evaluation.feedback}
          </div>
        )}

        {/* 4 Dimension Score Bars */}
        <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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
          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Key Strengths</span>
            </div>
            {evaluation.strengths && evaluation.strengths.length > 0 ? (
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                {evaluation.strengths.map((str, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {str}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">None highlighted for this question.</p>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Areas for Improvement</span>
            </div>
            {evaluation.improvements && evaluation.improvements.length > 0 ? (
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                {evaluation.improvements.map((imp, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {imp}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No major weaknesses identified.</p>
            )}
          </div>
        </div>

        {/* Suggested Ideal Answer (Collapsible) */}
        {evaluation.suggestedIdealAnswer && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowIdealAnswer((prev) => !prev)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Reference Model Answer</span>
              </div>
              {showIdealAnswer ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showIdealAnswer && (
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
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
