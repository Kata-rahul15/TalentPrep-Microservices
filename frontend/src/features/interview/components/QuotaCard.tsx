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
          ? 'bg-card border-destructive/30'
          : isLow
            ? 'bg-card border-border'
            : 'bg-card border-border',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border',
              isExhausted
                ? 'bg-card text-destructive border-destructive/30'
                : 'bg-[#080908] text-[#CDF22B] border-border'
            )}
          >
            {isExhausted ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Interview Quota
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-secondary-bg text-foreground border border-border">
                {planType}
              </span>
            </div>

            <p className="font-semibold text-base text-foreground mt-0.5">
              <span className="tabular-nums font-mono">{remainingSessions}</span> {remainingSessions === 1 ? 'Session' : 'Sessions'} Remaining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {hasAvailableQuota ? (
            <span className="inline-flex items-center gap-1 text-foreground font-medium bg-secondary-bg px-2 py-0.5 rounded-md border border-border text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-[#080908]" />
              Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20 text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              Limit Reached
            </span>
          )}
        </div>
      </div>

      {isExhausted && showUpgradeHint && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>Quota exhausted for this billing cycle.</span>
          <button
            type="button"
            className="text-xs font-semibold text-foreground underline hover:text-foreground/80 cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  )
}
