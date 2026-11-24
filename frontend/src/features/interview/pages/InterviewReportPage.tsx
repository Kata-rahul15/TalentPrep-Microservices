import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Printer,
  BookOpen,
  Layers,
} from 'lucide-react'
import { useInterviewReport, useInterviewSession } from '../hooks/useInterview'
import ScoreRing from '@/features/resume/components/ScoreRing'
import { formatRoundTitle } from '../utils/interviewFormatters'
import { getErrorMessage } from '@/services/authService'

export default function InterviewReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: report, isLoading, error } = useInterviewReport(sessionId)
  const { data: session } = useInterviewSession(sessionId)

  useEffect(() => {
    // Clear active session storage now that report is generated
    sessionStorage.removeItem('talentprep_active_session_id')
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Aggregating Performance Report...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="font-semibold text-base text-slate-900 dark:text-slate-100">
          Report Not Ready
        </h2>
        <p className="text-xs text-slate-500 max-w-sm text-center">
          {error ? getErrorMessage(error) : 'Unable to find or load the interview report.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/interview')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white cursor-pointer"
        >
          Return to Studio
        </button>
      </div>
    )
  }

  const isZeroScore = report.overallScore === 0
  const isHighReady = report.overallScore >= 80
  const isCompetent = report.overallScore >= 65

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-medium uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Official Evaluation Debrief</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Performance Assessment Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Target Role: <strong className="text-slate-800 dark:text-slate-200 font-medium">{session?.targetRole || 'Software Engineer'}</strong> • {new Date(report.generatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/interview/${sessionId}/transcript`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Full Transcript</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/interview/setup')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Simulation</span>
          </button>
        </div>
      </div>

      {/* ── Overall Score & Evaluation Summary ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Score Ring */}
          <div className="flex flex-col items-center text-center flex-shrink-0">
            {isZeroScore ? (
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-2 text-center border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-400">N/A</span>
                <span className="text-[10px] text-slate-400">Unevaluated</span>
              </div>
            ) : (
              <ScoreRing score={report.overallScore} size="lg" label="Overall" />
            )}

            <div className="mt-2.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                  isZeroScore
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    : isHighReady
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                      : isCompetent
                        ? 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
                }`}
              >
                {isZeroScore
                  ? 'Unevaluated'
                  : isHighReady
                    ? 'Tier-1 Ready'
                    : isCompetent
                      ? 'Solid Competency'
                      : 'Needs Preparation'}
              </span>
            </div>
          </div>

          {/* Feedback Prose */}
          <div className="space-y-2 flex-1 text-center md:text-left">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Executive Evaluation Summary
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isZeroScore
                ? 'This session ended before answers could be evaluated. Complete questions in your next simulation to receive full score metrics.'
                : report.summary || report.overallFeedback}
            </p>
          </div>
        </div>
      </div>

      {/* ── Strengths & Areas for Improvement ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Demonstrated Strengths</span>
          </div>
          {report.strengths && report.strengths.length > 0 ? (
            <ul className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="leading-relaxed">
                  {str}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No specific strengths captured.</p>
          )}
        </div>

        {/* Improvement Areas */}
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Target Growth Areas</span>
          </div>
          {report.weaknesses && report.weaknesses.length > 0 ? (
            <ul className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 space-y-2 list-disc list-inside">
              {report.weaknesses.map((wk, idx) => (
                <li key={idx} className="leading-relaxed">
                  {wk}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No weaknesses recorded.</p>
          )}
        </div>
      </div>

      {/* ── Round Summaries ── */}
      {((report.roundBreakdown && report.roundBreakdown.length > 0) ||
        (report.roundSummaries && report.roundSummaries.length > 0)) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Round-by-Round Breakdown</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(report.roundBreakdown || report.roundSummaries || []).map((rs, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {formatRoundTitle(String(rs.roundType))}
                    </span>
                    <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {rs.roundScore !== null && rs.roundScore !== undefined
                        ? `${rs.roundScore} pts`
                        : 'N/A'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {rs.summary ||
                      `Completed ${rs.completedQuestions ?? 0} of ${rs.questionsCount ?? 0} questions in this round.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommended Study Topics ── */}
      {report.recommendedTopics && report.recommendedTopics.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Recommended Preparation Topics</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {report.recommendedTopics.map((topic, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
