import { Cpu, Network, Users, Code2 } from 'lucide-react'
import type { RoundType } from '../types/interview.types'

export interface InterviewTypeOption {
  id: RoundType
  title: string
  badge: string
  description: string
  icon: typeof Cpu
}

const INTERVIEW_TYPE_OPTIONS: InterviewTypeOption[] = [
  {
    id: 'TECHNICAL',
    title: 'Technical Interview',
    badge: 'Core & Projects',
    description:
      'Deep dive into programming fundamentals, system architecture, engineering decisions, and your verified resume projects.',
    icon: Cpu,
  },
  {
    id: 'SYSTEM_DESIGN',
    title: 'System Design Interview',
    badge: 'Distributed Systems',
    description:
      'Design scalable distributed architectures: data partitioning, caching, message queues, reliability, and failure modes.',
    icon: Network,
  },
  {
    id: 'BEHAVIORAL',
    title: 'HR Interview',
    badge: 'STAR Framework',
    description:
      'Leadership scenarios, cross-functional collaboration, ownership examples, and structured STAR storytelling questions.',
    icon: Users,
  },
  {
    id: 'CODING',
    title: 'Coding Round',
    badge: 'Algorithms & Complexity',
    description:
      'Algorithmic problem-solving across your chosen language with structured test cases and AI code analysis.',
    icon: Code2,
  },
]

interface InterviewTypeSelectorProps {
  value: RoundType
  onChange: (type: RoundType) => void
}

export default function InterviewTypeSelector({
  value,
  onChange,
}: InterviewTypeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Interview Type"
      className="grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      {INTERVIEW_TYPE_OPTIONS.map((option) => {
        const Icon = option.icon
        const isSelected = value === option.id

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={`group text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-start gap-3.5 ${isSelected
                ? 'bg-slate-50 dark:bg-slate-800/90 border-blue-600 dark:border-blue-500 shadow-2xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {option.title}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${isSelected
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                >
                  {option.badge}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {option.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
