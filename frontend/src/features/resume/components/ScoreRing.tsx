import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
  color?: string
}

const sizeMap = {
  sm: { outer: 48, stroke: 4, font: 'text-xs font-mono font-bold', labelFont: 'text-[8px] font-mono' },
  md: { outer: 60, stroke: 5, font: 'text-sm font-mono font-bold', labelFont: 'text-[9px] font-mono' },
  lg: { outer: 84, stroke: 6, font: 'text-xl font-mono font-black', labelFont: 'text-[11px] font-mono' },
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#080908'
  if (score >= 50) return '#383B36'
  return '#DC2626'
}

export default function ScoreRing({
  score,
  size = 'md',
  label = '/100',
  className,
  color,
}: ScoreRingProps) {
  const { outer, stroke, font, labelFont } = sizeMap[size]
  const radius = (outer - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(score, 0), 100)
  const offset = circumference - (progress / 100) * circumference
  const ringColor = color ?? getScoreColor(score)
  const center = outer / 2

  return (
    <div className={cn('relative flex items-center justify-center flex-shrink-0', className)} style={{ width: outer, height: outer }}>
      <svg width={outer} height={outer} className="-rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-[#E5E0D5] dark:text-[#232621]"
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="dark:stroke-[#CDF22B]"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      {/* Center text overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <span className={cn('leading-none text-[#080908] dark:text-[#FAF8F3] tabular-nums', font)}>
          {score}
        </span>
        {label && (
          <span className={cn('text-[#383B36] dark:text-[#BDB9AF] leading-none mt-0.5', labelFont)}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export function ScoreRingContainer({
  score,
  size = 'md',
  label = '/100',
  className,
  color,
}: ScoreRingProps) {
  return <ScoreRing score={score} size={size} label={label} color={color} className={className} />
}
