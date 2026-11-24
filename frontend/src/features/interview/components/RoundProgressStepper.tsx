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
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-900 dark:border-slate-100 font-medium'
                  : isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-medium flex-shrink-0',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : round.roundOrder}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-slate-100">
                  {formatRoundTitle(round.roundType)}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
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
