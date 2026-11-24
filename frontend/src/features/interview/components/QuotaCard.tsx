import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { PlanType } from '../types/interview.types'
import { cn } from '@/lib/utils'

interface QuotaCardProps {
  planType?: PlanType
  remainingSessions?: number
  hasAvailableQuota?: boolean
  className?: string
  showUpgradeHint?: boolean
}

export default function QuotaCard({
  planType = 'FREE',
  remainingSessions = 0,
  hasAvailableQuota = true,
  className,
  showUpgradeHint = true,
}: QuotaCardProps) {
  const isExhausted = !hasAvailableQuota || remainingSessions <= 0
  const isLow = remainingSessions === 1

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        isExhausted
          ? 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10'
          : isLow
            ? 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10'
            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border',
              isExhausted
                ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40'
                : 'bg-blue-50 text-blue-600 border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/40'
            )}
          >
            {isExhausted ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Interview Quota
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider',
                  planType === 'ENTERPRISE'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    : planType === 'PRO'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                {planType}
              </span>
            </div>

            <p className="font-semibold text-base text-slate-900 dark:text-slate-100 mt-0.5">
              {remainingSessions} {remainingSessions === 1 ? 'Session' : 'Sessions'} Remaining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {hasAvailableQuota ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              Limit Reached
            </span>
          )}
        </div>
      </div>

      {isExhausted && showUpgradeHint && (
        <div className="mt-3 pt-3 border-t border-rose-200/50 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <span>Quota exhausted for this billing cycle.</span>
          <button
            type="button"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  )
}
