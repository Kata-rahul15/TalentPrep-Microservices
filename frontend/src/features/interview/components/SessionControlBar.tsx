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
          'flex items-center gap-1.5 p-1 rounded-lg bg-secondary-bg/60 border border-border text-xs',
          className
        )}
      >
        {/* Pause / Resume Button */}
        {isPaused ? (
          <button
            type="button"
            onClick={onResume}
            disabled={isDisabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080908] hover:bg-[#1f201e] disabled:opacity-50 disabled:cursor-not-allowed text-[#CDF22B] font-bold transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            disabled={isDisabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-card hover:bg-secondary-bg border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-card hover:bg-secondary-bg border border-border text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <FastForward className="w-3 h-3 text-muted-foreground" />
          <span>Skip</span>
        </button>

        {/* End Interview Early Button */}
        <button
          type="button"
          onClick={() => setShowEndModal(true)}
          disabled={isDisabled || isEnding}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-red-600 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          <span>End</span>
        </button>
      </div>

      {/* ── Skip Confirmation Modal ── */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 bg-[#080908]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Skip current question</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Skipping will record zero score for this question and move directly to the next question in the round.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary-bg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="px-3 py-1.5 rounded-lg bg-[#080908] hover:bg-[#1f201e] text-[#CDF22B] text-xs font-bold cursor-pointer"
              >
                Confirm skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── End Confirmation Modal ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-[#080908]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>End interview early</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The session will conclude immediately. Your performance report will be generated from answers submitted so far.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary-bg cursor-pointer"
              >
                Continue interview
              </button>
              <button
                type="button"
                onClick={handleConfirmEnd}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
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
