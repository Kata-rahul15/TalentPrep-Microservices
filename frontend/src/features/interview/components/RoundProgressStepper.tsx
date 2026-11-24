import { Check } from 'lucide-react'
import type { InterviewRoundResponse } from '../types/interview.types'
import { cn } from '@/lib/utils'
import { formatRoundTitle } from '../utils/interviewFormatters'

interface RoundProgressStepperProps {
  rounds: InterviewRoundResponse[]
  currentRoundIndex: number
  className?: string
}

export default function RoundProgressStepper({
  rounds,
  currentRoundIndex,
  className,
}: RoundProgressStepperProps) {
  if (!rounds || rounds.length === 0) return null

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {rounds.map((round, index) => {
          const isCompleted = round.status === 'COMPLETED' || index < currentRoundIndex
          const isActive = index === currentRoundIndex && round.status !== 'COMPLETED'

          return (
            <div
              key={round.id || index}
              className={cn(
                'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs flex-shrink-0 transition-colors',
                isActive
                  ? 'bg-[#080908] text-[#FAF8F3] border-[#080908] font-medium shadow-xs'
                  : isCompleted
                    ? 'bg-card border-border text-foreground'
                    : 'bg-card/50 border-border/60 text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0',
                  isActive
                    ? 'bg-[#CDF22B] text-[#080908]'
                    : isCompleted
                      ? 'bg-[#080908] text-[#CDF22B]'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : round.roundOrder}
              </div>

              <div className="flex items-center gap-2">
                <span className={isActive ? 'text-[#FAF8F3]' : 'text-foreground'}>
                  {formatRoundTitle(round.roundType)}
                </span>
                <span
                  className={cn(
                    'text-[11px] font-mono tabular-nums',
                    isActive ? 'text-[#FAF8F3]/60' : 'text-muted-foreground'
                  )}
                >
                  {round.completedQuestionCount}/{round.targetQuestionCount}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
