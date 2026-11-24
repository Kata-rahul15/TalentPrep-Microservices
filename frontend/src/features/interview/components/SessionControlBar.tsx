import { useState } from 'react'
import { Pause, Play, FastForward, LogOut, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionControlBarProps {
  isPaused: boolean
  isEnding: boolean
  isSkipping: boolean
  isDisabled?: boolean
  onPause: () => Promise<void> | void
  onResume: () => Promise<void> | void
  onSkip: () => Promise<void> | void
  onEndEarly: () => Promise<void> | void
  className?: string
}

export default function SessionControlBar({
  isPaused,
  isEnding,
  isSkipping,
  isDisabled = false,
  onPause,
  onResume,
  onSkip,
  onEndEarly,
  className,
}: SessionControlBarProps) {
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)

  const handleConfirmSkip = async () => {
    setShowSkipModal(false)
    await onSkip()
  }

  const handleConfirmEnd = async () => {
    setShowEndModal(false)
    await onEndEarly()
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs',
          className
        )}
      >
        {/* Pause / Resume Button */}
        {isPaused ? (
          <button
            type="button"
            onClick={onResume}
            disabled={isDisabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            disabled={isDisabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>
        )}

        {/* Skip Question Button */}
        <button
          type="button"
          onClick={() => setShowSkipModal(true)}
          disabled={isDisabled || isSkipping || isPaused}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <FastForward className="w-3 h-3 text-slate-400" />
          <span>Skip</span>
        </button>

        {/* End Interview Early Button */}
        <button
          type="button"
          onClick={() => setShowEndModal(true)}
          disabled={isDisabled || isEnding}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          <span>End</span>
        </button>
      </div>

      {/* ── Skip Confirmation Modal ── */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Skip current question</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Skipping will record zero score for this question and move directly to the next question in the round.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium cursor-pointer"
              >
                Confirm skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── End Confirmation Modal ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>End interview early</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The session will conclude immediately. Your performance report will be generated from answers submitted so far.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Continue interview
              </button>
              <button
                type="button"
                onClick={handleConfirmEnd}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium cursor-pointer"
              >
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
