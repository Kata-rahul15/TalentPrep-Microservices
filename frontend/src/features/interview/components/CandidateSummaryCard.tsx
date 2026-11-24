import { Link } from 'react-router-dom'
import { FileText, AlertCircle, RefreshCw } from 'lucide-react'
import type { CandidateSetupDetailsResponse } from '../types/interview.types'

interface CandidateSummaryCardProps {
  setupData: CandidateSetupDetailsResponse | undefined
  isLoading?: boolean
  resumeTitle?: string
  onChangeResumeClick?: () => void
  hasResumes?: boolean
}

export default function CandidateSummaryCard({
  setupData,
  isLoading = false,
  resumeTitle,
  onChangeResumeClick,
  hasResumes = false,
}: CandidateSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading candidate profile context...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!setupData || !setupData.resumeAvailable) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Resume context unlinked</span>
          </div>
          <div className="flex items-center gap-3">
            {hasResumes && onChangeResumeClick && (
              <button
                type="button"
                onClick={onChangeResumeClick}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Select resume
              </button>
            )}
            <Link
              to="/resume/upload"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Upload resume
            </Link>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Questions will adapt directly to the target role, round type, and difficulty you specify below.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Candidate Context Dossier</span>
          {resumeTitle && (
            <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs">
              ({resumeTitle})
            </span>
          )}
        </div>
        {onChangeResumeClick && (
          <button
            type="button"
            onClick={onChangeResumeClick}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Switch resume</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Candidate</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {setupData.candidateName || 'Candidate'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Target Role</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {setupData.targetRole || 'Software Engineer'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-400">Experience Level</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {setupData.experienceLevel || 'Mid-Level'}
          </p>
        </div>
      </div>

      {setupData.skills && setupData.skills.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Verified Skills:</span>
            {setupData.skills.slice(0, 8).map((skill, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 rounded"
              >
                {skill}
              </span>
            ))}
            {setupData.skills.length > 8 && (
              <span className="text-[11px] text-slate-400 font-mono">
                +{setupData.skills.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
