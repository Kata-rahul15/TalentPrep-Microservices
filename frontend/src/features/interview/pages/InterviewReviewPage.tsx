import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react'
import { useInterviewDetail } from '../hooks/useInterview'
import CodingInterviewWorkspace from '../components/CodingInterviewWorkspace'
import type { InterviewQuestionResponse, InterviewQuestionReview } from '../types/interview.types'
import ScoreRing from '@/features/resume/components/ScoreRing'
import ScoreBar from '@/features/resume/components/ScoreBar'
import { formatRoundTitle } from '../utils/interviewFormatters'

export default function InterviewReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: detail, isLoading, error } = useInterviewDetail(sessionId)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)

  // Identify all questions in coding rounds
  const codingQuestions = useMemo(() => {
    return (detail?.questions || []).filter((q) => q.roundType === 'CODING')
  }, [detail])

  const isCodingInterview =
    detail?.mode === 'CODING' ||
    codingQuestions.length > 0 ||
    detail?.rounds?.some((r) => r.roundType === 'CODING')

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-7 h-7 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">Loading interview records...</p>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="font-heading font-bold text-base text-foreground">
          Interview Record Not Found
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          Unable to find the requested interview details or access is restricted.
        </p>
        <button
          type="button"
          onClick={() => navigate('/interview')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 cursor-pointer"
        >
          Return to Interview Studio
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CODING INTERVIEW REVIEW: Reuse CodingInterviewWorkspace in readOnly mode
  // ─────────────────────────────────────────────────────────────────────────────
  if (isCodingInterview && codingQuestions.length > 0) {
    const activeQ = codingQuestions[selectedQuestionIndex] || codingQuestions[0]

    // Convert review question into InterviewQuestionResponse format for workspace
    const workspaceQuestion: InterviewQuestionResponse = {
      questionId: activeQ.questionId,
      roundId: activeQ.roundId || 'review-round',
      sessionId: sessionId || '',
      roundOrder: activeQ.roundOrder || 1,
      questionOrder: activeQ.questionOrder || selectedQuestionIndex + 1,
      questionText: activeQ.questionText,
      questionCategory: activeQ.questionCategory || null,
      difficulty: (activeQ.difficulty || detail.difficulty || 'MEDIUM') as any,
      roundType: 'CODING',
      codingBoilerplate: activeQ.codingBoilerplate || null,
      codingTestCases: activeQ.codingTestCases || [],
      targetQuestionCount: codingQuestions.length,
      isFollowUp: false,
      questionStatus: 'ANSWERED',
    }

    return (
      <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
        {/* Navigation / Switcher Bar above Workspace */}
        <header className="h-12 flex-shrink-0 bg-card border-b border-border px-3 sm:px-4 flex items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/interview')}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary-bg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Back to Interview Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-heading font-bold text-xs sm:text-sm text-foreground truncate">
                {detail.targetRole || 'Software Engineer'}
              </span>
              <span className="text-muted-foreground text-xs hidden sm:inline">•</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-semibold hidden sm:inline-block">
                Read-Only Review
              </span>
            </div>
          </div>

          {/* Question Switcher Tabs (If multiple coding questions) */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {codingQuestions.map((q, idx) => (
              <button
                key={q.questionId}
                type="button"
                onClick={() => setSelectedQuestionIndex(idx)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedQuestionIndex === idx
                    ? 'bg-[#2563EB] text-white shadow-2xs font-bold'
                    : 'bg-secondary-bg hover:bg-muted text-foreground border border-border'
                }`}
              >
                <span>Question {idx + 1}</span>
                {q.score !== null && q.score !== undefined && (
                  <span className="ml-1.5 text-[10px] opacity-90">({q.score}pts)</span>
                )}
              </button>
            ))}
          </div>

          {/* Right Action: Report Link */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {detail.overallScore !== null && detail.overallScore !== undefined && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold hidden sm:inline-block">
                Overall: {detail.overallScore}%
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate(`/interview/${sessionId}/report`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary-bg text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span>View Report</span>
            </button>
          </div>
        </header>

        {/* Read-Only Monaco Coding Workspace */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodingInterviewWorkspace
            question={workspaceQuestion}
            codeText={activeQ.codeSubmission || activeQ.codingBoilerplate || ''}
            onChangeCode={() => {}}
            readOnly={true}
            initialLanguage={activeQ.language || 'java'}
            persistedScore={activeQ.score}
            persistedMetrics={activeQ.executionMetrics}
            elapsedSeconds={activeQ.timeTakenSeconds || 0}
          />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. NON-CODING INTERVIEW REVIEW: Technical, Behavioral (HR), System Design
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/interview')}
            className="p-2 rounded-lg border border-border hover:bg-secondary-bg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Back to Interview Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>Interview Review</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{detail.mode || 'TECHNICAL'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
              {detail.targetRole || 'Software Engineer'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/interview/${sessionId}/report`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Performance Report</span>
          </button>
        </div>
      </div>

      {/* ── Session Meta Overview ── */}
      <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : 'N/A'}</span>
            </span>
            {detail.durationMinutes !== null && detail.durationMinutes !== undefined && detail.durationMinutes > 0 && (
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{detail.durationMinutes} min session</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span>{detail.rounds?.length || 1} Round(s)</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-bg border border-border text-foreground">
              {detail.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Overall Score
              </span>
              <div className="text-lg font-bold font-mono text-[#111827] dark:text-foreground">
                {detail.overallScore !== null && detail.overallScore !== undefined
                  ? `${detail.overallScore}%`
                  : 'N/A'}
              </div>
            </div>
            {detail.overallScore !== null && detail.overallScore !== undefined && (
              <ScoreRing score={detail.overallScore} size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* ── Rounds and Question List ── */}
      <div className="space-y-6">
        {detail.rounds?.map((round, rIdx) => {
          const roundQuestions = (detail.questions || []).filter(
            (q) => q.roundId === round.roundId || q.roundOrder === round.roundOrder
          )

          return (
            <div key={round.roundId || rIdx} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
                    {rIdx + 1}
                  </span>
                  <h2 className="text-base font-bold text-foreground">
                    {formatRoundTitle(round.roundType)}
                  </h2>
                </div>
                {round.roundScore !== null && round.roundScore !== undefined && (
                  <span className="text-xs font-mono font-bold text-foreground px-2.5 py-1 rounded bg-secondary-bg border border-border">
                    Score: {round.roundScore} pts
                  </span>
                )}
              </div>

              {/* Questions in this Round */}
              <div className="space-y-4">
                {roundQuestions.map((q: InterviewQuestionReview, qIdx: number) => (
                  <div
                    key={q.questionId || qIdx}
                    className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                          Question {q.questionOrder || qIdx + 1}
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                          {q.questionText}
                        </h3>
                      </div>
                      {q.score !== null && q.score !== undefined && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <ScoreRing score={q.score} size="sm" label="pts" />
                        </div>
                      )}
                    </div>

                    {/* Candidate Submitted Answer */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Candidate Answer</span>
                      </span>
                      <div className="p-3.5 rounded-xl bg-secondary-bg/70 border border-border text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {q.candidateAnswer || q.codeSubmission || '(No answer recorded)'}
                      </div>
                    </div>

                    {/* Competency Dimension Bars (if evaluated) */}
                    {(q.technicalAccuracy !== undefined ||
                      q.completeness !== undefined ||
                      q.clarity !== undefined ||
                      q.problemSolving !== undefined) && (
                      <div className="bg-secondary-bg/40 border border-border rounded-xl p-4 space-y-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Competency Dimensions
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.technicalAccuracy !== undefined && (
                            <ScoreBar score={q.technicalAccuracy} label="Technical Accuracy" />
                          )}
                          {q.completeness !== undefined && (
                            <ScoreBar score={q.completeness} label="Completeness" />
                          )}
                          {q.clarity !== undefined && (
                            <ScoreBar score={q.clarity} label="Clarity & Delivery" />
                          )}
                          {q.problemSolving !== undefined && (
                            <ScoreBar score={q.problemSolving} label="Problem Solving" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Strengths & Improvements */}
                    {((q.strengths && q.strengths.length > 0) ||
                      (q.improvements && q.improvements.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        {q.strengths && q.strengths.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Key Strengths</span>
                            </span>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                              {q.strengths.map((str: string, sIdx: number) => (
                                <li key={sIdx} className="leading-relaxed">
                                  {str}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {q.improvements && q.improvements.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Areas for Improvement</span>
                            </span>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                              {q.improvements.map((imp: string, iIdx: number) => (
                                <li key={iIdx} className="leading-relaxed">
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evaluation Feedback */}
                    {q.feedback && (
                      <div className="p-3.5 rounded-xl bg-secondary-bg/80 border border-border text-xs text-foreground leading-relaxed">
                        <strong className="font-semibold text-foreground">Assessment Feedback: </strong>
                        <span>{q.feedback}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
