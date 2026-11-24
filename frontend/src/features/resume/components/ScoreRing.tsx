import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
  color?: string
}

const sizeMap = {
  sm: { outer: 48, stroke: 4, font: 'text-xs font-bold', labelFont: 'text-[8px]' },
  md: { outer: 60, stroke: 5, font: 'text-sm sm:text-base font-extrabold', labelFont: 'text-[9px]' },
  lg: { outer: 84, stroke: 6.5, font: 'text-xl font-black', labelFont: 'text-[11px]' },
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#2563EB' // blue
  if (score >= 60) return '#3B82F6' // medium blue
  return '#F59E0B' // amber
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
          className="text-slate-100 dark:text-slate-800"
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
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      {/* Center text overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <span className={cn('font-heading leading-none text-slate-900 dark:text-white', font)}>
          {score}
        </span>
        {label && (
          <span className={cn('text-slate-400 font-medium leading-none mt-0.5', labelFont)}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

// Wrapper that handles the positioning
export function ScoreRingContainer({
  score,
  size = 'md',
  label = '/100',
  className,
  color,
}: ScoreRingProps) {
  return <ScoreRing score={score} size={size} label={label} color={color} className={className} />
}
