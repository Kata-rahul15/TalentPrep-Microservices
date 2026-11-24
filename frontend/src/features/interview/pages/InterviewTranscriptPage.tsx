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
        <div className="w-7 h-7 border-2 border-[#080908] border-t-[#CDF22B] rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Loading interview transcript...</p>
      </div>
    )
  }

  if (error || !transcript) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-card text-destructive flex items-center justify-center border border-destructive/30">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="font-semibold text-base text-foreground">
          Transcript Not Found
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          {error ? getErrorMessage(error) : 'Unable to find transcript for this session.'}
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

  const formatElapsed = (sec: number | null) => {
    if (!sec) return null
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/interview/${sessionId}/report`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Performance Report</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Interview Transcript
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Turn-by-turn dialogue log for <strong className="text-foreground font-medium">{transcript.targetRole || session?.targetRole || 'Interview Session'}</strong> • {(transcript.items || transcript.turns || []).length} Exchanged Turns
          </p>
        </div>

      </div>

      {/* ── Turns Feed ── */}
      {(transcript.items || transcript.turns) && (transcript.items || transcript.turns || []).length > 0 ? (
        <div className="space-y-4">
          {(transcript.items || transcript.turns || []).map((turn, index) => {
            const isSkipped = turn.status === 'SKIPPED' || turn.answerText === 'SKIPPED'
            return (
              <div
                key={turn.questionId || index}
                className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4"
              >
                {/* Turn Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-secondary-bg flex items-center justify-center font-mono text-[11px] font-bold text-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono uppercase tracking-wider bg-muted text-foreground border border-border">
                      <Layers className="w-3 h-3 text-foreground" />
                      <span>{formatRoundTitle(turn.roundType)}</span>
                    </span>

                    {turn.isFollowUp && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#CDF22B]/20 text-[#080908] border border-[#CDF22B]/40">
                        <Sparkles className="w-3 h-3" />
                        <span>Follow-up</span>
                      </span>
                    )}

                    {turn.questionCategory && (
                      <span className="text-xs text-muted-foreground font-medium">
                        • {turn.questionCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {turn.timeTakenSeconds ? (
                      <span className="flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{formatElapsed(turn.timeTakenSeconds)}</span>
                      </span>
                    ) : null}

                    {turn.score !== null ? (
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#080908] text-[#CDF22B]">
                        {turn.score} / 100 pts
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Interviewer Prompt
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                    {turn.questionText}
                  </p>
                </div>

                {/* Candidate Answer */}
                <div className="bg-secondary-bg/60 rounded-lg p-3.5 sm:p-4 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-foreground" />
                      <span>Candidate Response</span>
                    </p>

                    {isSkipped && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20">
                        <FastForward className="w-3 h-3" />
                        <span>Skipped</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {turn.answerText || (isSkipped ? 'Question was skipped by candidate.' : 'No recorded answer.')}
                  </p>
                </div>

                {/* Evaluation Feedback */}
                {turn.feedback && (
                  <div className="p-3.5 rounded-lg bg-card border border-border text-xs text-foreground leading-relaxed flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Evaluation: </span>
                      {turn.feedback}
                    </div>
                  </div>
                )}

                {/* Suggested Ideal Answer */}
                {turn.idealAnswer && (
                  <div className="p-3.5 rounded-lg bg-card border border-border text-xs text-foreground leading-relaxed flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Model Answer: </span>
                      {turn.idealAnswer}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-card border border-border rounded-xl space-y-2">
          <p className="font-medium text-sm text-foreground">
            No Transcribed Turns Available
          </p>
          <p className="text-xs text-muted-foreground">
            This interview session did not produce any conversational turns.
          </p>
        </div>
      )}
    </div>
  )
}
