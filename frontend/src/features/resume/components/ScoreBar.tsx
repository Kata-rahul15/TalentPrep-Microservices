import { cn } from '@/lib/utils'

interface ScoreBarProps {
  label: string
  score: number
  className?: string
  showValue?: boolean
  animated?: boolean
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-success'
  if (score >= 60) return 'bg-warning'
  return 'bg-danger'
}

export default function ScoreBar({ label, score, className, showValue = true, animated = true }: ScoreBarProps) {
  const clampedScore = Math.min(Math.max(score, 0), 100)
  const barColor = getBarColor(clampedScore)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary-foreground">{label}</span>
        {showValue && (
          <span
            className={cn('text-xs font-bold font-mono', {
              'text-success': clampedScore >= 80,
              'text-warning': clampedScore >= 60 && clampedScore < 80,
              'text-danger': clampedScore < 60,
            })}
          >
            {clampedScore}%
          </span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary-bg overflow-hidden">
        <div
          className={cn('h-full rounded-full', barColor, animated && 'transition-all duration-700 ease-out')}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  )
}
