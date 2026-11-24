import { cn } from '@/lib/utils'

interface ScoreBarProps {
  label: string
  score: number
  className?: string
  showValue?: boolean
  animated?: boolean
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-[#080908] dark:bg-[#CDF22B]'
  if (score >= 60) return 'bg-[#383B36] dark:bg-[#BDB9AF]'
  return 'bg-[#DC2626]'
}

export default function ScoreBar({ label, score, className, showValue = true, animated = true }: ScoreBarProps) {
  const clampedScore = Math.min(Math.max(score, 0), 100)
  const barColor = getBarColor(clampedScore)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#2C2E2B] dark:text-[#E2DFD7]">{label}</span>
        {showValue && (
          <span
            className={cn('text-xs font-mono font-bold tabular-nums', {
              'text-[#080908] dark:text-[#CDF22B]': clampedScore >= 80,
              'text-[#383B36] dark:text-[#BDB9AF]': clampedScore >= 60 && clampedScore < 80,
              'text-[#DC2626]': clampedScore < 60,
            })}
          >
            {clampedScore}%
          </span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#E5E0D5] dark:bg-[#232621] overflow-hidden">
        <div
          className={cn('h-full rounded-full', barColor, animated && 'transition-all duration-500 ease-out')}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  )
}
