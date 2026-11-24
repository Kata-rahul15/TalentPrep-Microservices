import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  BookOpen,
  Layers,
  Code2,
  Eye,
  CheckCheck,
  Clock,
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
        <div className="w-7 h-7 border-2 border-[#080908] border-t-[#CDF22B] rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Aggregating performance report...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-card text-destructive flex items-center justify-center border border-destructive/30">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="font-semibold text-base text-foreground">
          Report Not Ready
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          {error ? getErrorMessage(error) : 'Unable to find or load the interview report.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/interview')}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#CDF22B] text-[#080908] cursor-pointer hover:bg-[#b8da25]"
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
    <div className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-1.5 text-foreground text-xs font-medium uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-foreground" />
            <span>Official Evaluation Debrief</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Performance Assessment Report
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Target Role: <strong className="text-foreground font-medium">{session?.targetRole || 'Software Engineer'}</strong> • {new Date(report.generatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/interview/${sessionId}/review`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card hover:bg-secondary-bg border border-border text-xs font-medium text-foreground cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Review Answers & Code</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/interview/${sessionId}/transcript`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card hover:bg-secondary-bg border border-border text-xs font-medium text-foreground cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-foreground" />
            <span>Full Transcript</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/interview/setup')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#CDF22B] hover:bg-[#b8da25] text-[#080908] text-xs font-bold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Simulation</span>
          </button>
        </div>
      </div>

      {/* ── Overall Score & Evaluation Summary ── */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-7">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Score Ring */}
          <div className="flex flex-col items-center text-center flex-shrink-0">
            {isZeroScore ? (
              <div className="w-24 h-24 rounded-full bg-secondary-bg flex flex-col items-center justify-center p-2 text-center border border-border">
                <span className="text-xs font-semibold text-muted-foreground">N/A</span>
                <span className="text-[10px] text-muted-foreground">Unevaluated</span>
              </div>
            ) : (
              <ScoreRing score={report.overallScore} size="lg" label="Overall" />
            )}

            <div className="mt-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold bg-[#080908] text-[#CDF22B]">
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
            <h2 className="text-base font-semibold text-foreground">
              Executive Evaluation Summary
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
        <div className="bg-secondary-bg/60 border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <CheckCircle2 className="w-4 h-4 text-foreground" />
            <span>Demonstrated Strengths</span>
          </div>
          {report.strengths && report.strengths.length > 0 ? (
            <ul className="text-xs sm:text-[13px] text-muted-foreground space-y-2 list-disc list-inside">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="leading-relaxed">
                  {str}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No specific strengths captured.</p>
          )}
        </div>

        {/* Improvement Areas */}
        <div className="bg-secondary-bg/60 border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span>Target Growth Areas</span>
          </div>
          {report.weaknesses && report.weaknesses.length > 0 ? (
            <ul className="text-xs sm:text-[13px] text-muted-foreground space-y-2 list-disc list-inside">
              {report.weaknesses.map((wk, idx) => (
                <li key={idx} className="leading-relaxed">
                  {wk}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No weaknesses recorded.</p>
          )}
        </div>
      </div>

      {/* ── Round Summaries ── */}
      {((report.roundBreakdown && report.roundBreakdown.length > 0) ||
        (report.roundSummaries && report.roundSummaries.length > 0)) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-foreground" />
            <span>Round-by-Round Breakdown</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(report.roundBreakdown || report.roundSummaries || []).map((rs, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl p-4.5 space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                      {formatRoundTitle(String(rs.roundType))}
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                      {rs.roundScore !== null && rs.roundScore !== undefined
                        ? `${rs.roundScore} pts`
                        : 'N/A'}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {rs.summary ||
                      `Completed ${rs.completedQuestions ?? 0} of ${rs.questionsCount ?? 0} questions in this round.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detailed Coding Assessment Scorecard ── */}
      {report.roundBreakdown?.some((r) => r.roundType === 'CODING') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>Coding Assessment Scorecard</span>
            </h2>
            <button
              type="button"
              onClick={() => navigate(`/interview/${sessionId}/review`)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open in Code Review Workspace</span>
              <span>→</span>
            </button>
          </div>

          {report.roundBreakdown
            .filter((r) => r.roundType === 'CODING')
            .map((codingRound, rIdx) => (
              <div key={rIdx} className="space-y-4">
                {/* Aggregate Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-card border border-border rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Total Questions</span>
                    <p className="text-lg font-bold text-foreground font-mono">{codingRound.totalQuestions ?? codingRound.questionsCount ?? 0}</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Attempted</span>
                    <p className="text-lg font-bold text-blue-600 font-mono">{codingRound.attemptedQuestions ?? codingRound.completedQuestions ?? 0}</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Solved</span>
                    <p className="text-lg font-bold text-emerald-600 font-mono">{codingRound.solvedQuestions ?? 0}</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3.5 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Test Cases Passed</span>
                    <p className="text-lg font-bold text-foreground font-mono">
                      {codingRound.totalTestCasesPassed ?? 0}
                      <span className="text-xs font-normal text-muted-foreground"> / {(codingRound.totalTestCasesPassed ?? 0) + (codingRound.totalTestCasesFailed ?? 0)}</span>
                    </p>
                  </div>
                </div>

                {/* Per-Question Results */}
                {codingRound.questions && codingRound.questions.length > 0 && (
                  <div className="space-y-3">
                    {codingRound.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="bg-card border border-border rounded-xl p-5 space-y-3.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              Q{q.questionOrder || qIdx + 1}.
                            </span>
                            <h3 className="text-sm font-bold text-foreground line-clamp-1">
                              {q.questionText ? q.questionText.split('\n')[0].replace(/^#+\s*/, '') : `Problem ${qIdx + 1}`}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {q.language && (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary-bg border border-border text-foreground font-semibold">
                                {q.language}
                              </span>
                            )}
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded ${
                                q.verdict === 'ACCEPTED'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {q.verdict || (q.score >= 70 ? 'ACCEPTED' : 'FAILED')}
                            </span>
                            <span className="text-xs font-mono font-bold text-foreground">
                              {q.score} pts
                            </span>
                          </div>
                        </div>

                        {/* Metrics bar */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {q.totalCount !== undefined && q.totalCount > 0 && (
                            <span className="flex items-center gap-1 font-mono">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Passed {q.passedCount} / {q.totalCount} test cases</span>
                            </span>
                          )}
                          {q.executionTimeMs !== undefined && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{q.executionTimeMs} ms</span>
                            </span>
                          )}
                        </div>

                        {/* Submitted Code Viewer */}
                        {q.codeSubmission && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Submitted Code
                            </span>
                            <pre className="p-3.5 rounded-xl bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs overflow-x-auto whitespace-pre max-h-72 border border-border/80">
                              <code>{q.codeSubmission}</code>
                            </pre>
                          </div>
                        )}

                        {/* Deterministic Evaluation Feedback */}
                        {q.feedback && (
                          <div className="p-3 rounded-lg bg-secondary-bg/60 border border-border text-xs text-foreground leading-relaxed">
                            <strong className="font-semibold text-foreground">Assessment: </strong>
                            <span>{q.feedback}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* ── Recommended Study Topics ── */}
      {report.recommendedTopics && report.recommendedTopics.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
            <BookOpen className="w-4 h-4 text-foreground" />
            <span>Recommended Preparation Topics</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {report.recommendedTopics.map((topic, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-secondary-bg border border-border text-xs font-medium text-foreground"
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
