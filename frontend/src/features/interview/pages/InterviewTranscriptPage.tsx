import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  FastForward,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { useInterviewTranscript, useInterviewSession } from '../hooks/useInterview'
import { formatRoundTitle } from '../utils/interviewFormatters'
import { getErrorMessage } from '@/services/authService'

export default function InterviewTranscriptPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: transcript, isLoading, error } = useInterviewTranscript(sessionId)
  const { data: session } = useInterviewSession(sessionId)

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading Interview Transcript...</p>
      </div>
    )
  }

  if (error || !transcript) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="font-semibold text-base text-slate-900 dark:text-slate-100">
          Transcript Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-sm text-center">
          {error ? getErrorMessage(error) : 'Unable to find transcript for this session.'}
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

  const formatElapsed = (sec: number | null) => {
    if (!sec) return null
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/interview/${sessionId}/report`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Performance Report</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Interview Transcript
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Turn-by-turn dialogue log for <strong className="text-slate-800 dark:text-slate-200 font-medium">{transcript.targetRole || session?.targetRole || 'Interview Session'}</strong> • {(transcript.items || transcript.turns || []).length} Exchanged Turns
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer print:hidden transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Print Transcript</span>
        </button>
      </div>

      {/* ── Turns Feed ── */}
      {(transcript.items || transcript.turns) && (transcript.items || transcript.turns || []).length > 0 ? (
        <div className="space-y-4">
          {(transcript.items || transcript.turns || []).map((turn, index) => {
            const isSkipped = turn.status === 'SKIPPED' || turn.answerText === 'SKIPPED'
            return (
              <div
                key={turn.questionId || index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4"
              >
                {/* Turn Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Layers className="w-3 h-3 text-blue-600" />
                      <span>{formatRoundTitle(turn.roundType)}</span>
                    </span>

                    {turn.isFollowUp && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Follow-up</span>
                      </span>
                    )}

                    {turn.questionCategory && (
                      <span className="text-xs text-slate-500 font-medium">
                        • {turn.questionCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {turn.timeTakenSeconds ? (
                      <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{formatElapsed(turn.timeTakenSeconds)}</span>
                      </span>
                    ) : null}

                    {turn.score !== null ? (
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20">
                        {turn.score} / 100 pts
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Interviewer Prompt
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {turn.questionText}
                  </p>
                </div>

                {/* Candidate Answer */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Candidate Response</span>
                    </p>

                    {isSkipped && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <FastForward className="w-3 h-3" />
                        <span>Skipped</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {turn.answerText || (isSkipped ? 'Question was skipped by candidate.' : 'No recorded answer.')}
                  </p>
                </div>

                {/* Evaluation Feedback */}
                {turn.feedback && (
                  <div className="p-3.5 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-900 dark:text-blue-300">Evaluation: </span>
                      {turn.feedback}
                    </div>
                  </div>
                )}

                {/* Suggested Ideal Answer */}
                {turn.idealAnswer && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-900 dark:text-emerald-300">Model Answer: </span>
                      {turn.idealAnswer}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
            No Transcribed Turns Available
          </p>
          <p className="text-xs text-slate-400">
            This interview session did not produce any conversational turns.
          </p>
        </div>
      )}
    </div>
  )
}
