import { motion } from 'framer-motion'
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { InterviewRoundResponse } from '../types/interview.types'
import { formatRoundTitle } from '../utils/interviewFormatters'

interface RoundTransitionModalProps {
  completedRound: InterviewRoundResponse | undefined
  nextRound: InterviewRoundResponse | undefined
  onStartNextRound: () => void
  isLoading?: boolean
}

export default function RoundTransitionModal({
  completedRound,
  nextRound,
  onStartNextRound,
  isLoading = false,
}: RoundTransitionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
            Stage Completed
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
            {completedRound ? formatRoundTitle(completedRound.roundType) : 'Current Round'} Concluded
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Round evaluation recorded. Review the upcoming stage specifications before initiating.
          </p>
        </div>

        {nextRound && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-left flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-900/40">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Up Next</p>
                <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  Round 0{nextRound.roundOrder}: {formatRoundTitle(nextRound.roundType)}
                </p>
                <p className="text-xs text-slate-500">
                  ~{nextRound.targetQuestionCount} target questions
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onStartNextRound}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preparing Next Round...</span>
              </>
            ) : (
              <>
                <span>Start Next Round</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
