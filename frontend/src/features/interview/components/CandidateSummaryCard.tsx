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
      <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Loading candidate profile context...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="h-10 bg-secondary-bg rounded-lg animate-pulse" />
          <div className="h-10 bg-secondary-bg rounded-lg animate-pulse" />
          <div className="h-10 bg-secondary-bg rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!setupData || !setupData.resumeAvailable) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Resume context unlinked</span>
          </div>
          <div className="flex items-center gap-3">
            {hasResumes && onChangeResumeClick && (
              <button
                type="button"
                onClick={onChangeResumeClick}
                className="text-xs font-semibold text-foreground hover:underline cursor-pointer"
              >
                Select resume
              </button>
            )}
            <Link
              to="/resume/upload"
              className="text-xs font-semibold text-foreground hover:underline"
            >
              Upload resume
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Questions will adapt directly to the target role, round type, and difficulty you specify below.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <FileText className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
          <span>Candidate Context Dossier</span>
          {resumeTitle && (
            <span className="text-muted-foreground font-mono text-[11px] truncate max-w-xs">
              ({resumeTitle})
            </span>
          )}
        </div>
        {onChangeResumeClick && (
          <button
            type="button"
            onClick={onChangeResumeClick}
            className="text-xs font-semibold text-foreground hover:underline cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3 text-[#080908] dark:text-[#CDF22B]" />
            <span>Switch resume</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground">Candidate</span>
          <p className="text-sm font-heading font-bold text-foreground truncate">
            {setupData.candidateName || 'Candidate'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground">Target Role</span>
          <p className="text-sm font-heading font-bold text-foreground truncate">
            {setupData.targetRole || 'Software Engineer'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground">Experience Level</span>
          <p className="text-sm font-heading font-bold text-foreground truncate">
            {setupData.experienceLevel || 'Mid-Level'}
          </p>
        </div>
      </div>

      {setupData.skills && setupData.skills.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">Verified Skills:</span>
            {setupData.skills.slice(0, 8).map((skill, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 bg-secondary-bg text-foreground border border-border rounded font-mono"
              >
                {skill}
              </span>
            ))}
            {setupData.skills.length > 8 && (
              <span className="text-[11px] text-muted-foreground font-mono">
                +{setupData.skills.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
