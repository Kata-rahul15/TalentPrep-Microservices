import type React from 'react'
import type {
  ResumeSectionKey,
  ResumeBuilderData,
} from '../../types/builder.types'
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Trophy,
  Layers,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  activeSection: ResumeSectionKey
  onSelectSection: (section: ResumeSectionKey) => void
  data: ResumeBuilderData
  onToggleVisibility: (section: ResumeSectionKey) => void
  onMoveSection: (section: ResumeSectionKey, direction: 'up' | 'down') => void
  completeness: {
    overall: number
    sectionScores: Record<string, boolean>
  }
  embedded?: boolean
}

const SECTION_CONFIG: Record<
  ResumeSectionKey,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  personal: { label: 'Personal Info', icon: User },
  summary: { label: 'Summary', icon: FileText },
  experience: { label: 'Work Experience', icon: Briefcase },
  education: { label: 'Education', icon: GraduationCap },
  skills: { label: 'Technical Skills', icon: Wrench },
  projects: { label: 'Projects', icon: FolderGit2 },
  certifications: { label: 'Certifications', icon: Award },
  achievements: { label: 'Achievements', icon: Trophy },
  custom: { label: 'Custom Sections', icon: Layers },
}

export default function ResumeSectionSidebar({
  activeSection,
  onSelectSection,
  data,
  onToggleVisibility,
  onMoveSection,
  completeness,
  embedded = false,
}: Props) {
  const sections = data.sectionOrder || [
    'personal',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'achievements',
    'custom',
  ]

  return (
    <aside
      className={cn(
        'flex-shrink-0 space-y-3',
        embedded
          ? 'w-full'
          : 'w-full md:w-56 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 shadow-2xs'
      )}
    >
      {/* Completeness Meter */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Resume Strength
          </span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {completeness.overall}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${completeness.overall}%` }}
          />
        </div>
      </div>

      {/* Sections List */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mb-1.5">
          Resume Sections
        </p>

        <nav className="space-y-1">
          {sections.map((key, index) => {
            const config = SECTION_CONFIG[key]
            if (!config) return null
            const Icon = config.icon
            const isActive = activeSection === key
            const isVisible = data.sectionVisibility[key] !== false
            const isComplete = Boolean(completeness.sectionScores[key])

            return (
              <div
                key={key}
                className={cn(
                  'group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/80 dark:border-blue-900/60'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900'
                )}
              >
                {/* Clickable section select button */}
                <button
                  type="button"
                  onClick={() => onSelectSection(key)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer focus:outline-none"
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 flex-shrink-0',
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    )}
                  />
                  <span className="truncate text-xs">{config.label}</span>
                </button>

                {/* Right actions: Checkmark, Visibility, Reorder */}
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 flex-shrink-0">
                  {isComplete && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-0.5" />
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleVisibility(key)}
                    className={cn(
                      'p-0.5 hover:text-slate-900 transition-colors cursor-pointer',
                      !isVisible && 'text-slate-300 dark:text-slate-600'
                    )}
                    title={isVisible ? 'Hide from resume' : 'Show on resume'}
                  >
                    {isVisible ? (
                      <Eye className="w-3 h-3 text-slate-400" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-slate-300" />
                    )}
                  </button>

                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveSection(key, 'up')}
                      className="p-0.2 text-slate-300 hover:text-slate-600 disabled:opacity-20 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sections.length - 1}
                      onClick={() => onMoveSection(key, 'down')}
                      className="p-0.2 text-slate-300 hover:text-slate-600 disabled:opacity-20 cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
