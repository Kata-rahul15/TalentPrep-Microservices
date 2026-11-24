import { useNavigate } from 'react-router-dom'
import {
  Video,
  PlayCircle,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  History,
  Calendar,
  Award,
  Eye,
  FileText,
  Play,
  Code2,
  Cpu,
  Users,
} from 'lucide-react'
import type { DifficultyLevel, RoundType } from '../types/interview.types'
import { useInterviewHistory } from '../hooks/useInterview'

interface PracticeTrack {
  id: string
  title: string
  category: string
  duration: number
  difficulty: DifficultyLevel
  rounds: RoundType[]
  description: string
  skills: string[]
}

const PRESET_TRACKS: PracticeTrack[] = [
  {
    id: 'technical-interview',
    title: 'Technical Interview',
    category: 'Technical Interview',
    duration: 45,
    difficulty: 'HARD',
    rounds: ['TECHNICAL'],
    description:
      'Evaluate your technical knowledge, programming concepts, technologies, and practical experience through questions tailored to your resume.',
    skills: ['Programming Concepts', 'System Architecture', 'Core CS Fundamentals', 'Resume Projects'],
  },
  {
    id: 'system-design',
    title: 'System Design',
    category: 'System Design',
    duration: 45,
    difficulty: 'MEDIUM',
    rounds: ['SYSTEM_DESIGN'],
    description:
      'Demonstrate your ability to design scalable, reliable systems and explain architectural decisions through practical scenarios.',
    skills: ['Distributed Systems', 'Scalability', 'System Architecture', 'Reliability'],
  },
  {
    id: 'coding-round',
    title: 'Coding Round',
    category: 'Coding Round',
    duration: 60,
    difficulty: 'HARD',
    rounds: ['CODING'],
    description:
      'Solve programming challenges, execute your code against test cases, and demonstrate your problem-solving abilities.',
    skills: ['Algorithms', 'Data Structures', 'Optimization', 'Problem Solving'],
  },
  {
    id: 'hr-interview',
    title: 'HR Interview',
    category: 'HR Interview',
    duration: 30,
    difficulty: 'MEDIUM',
    rounds: ['BEHAVIORAL'],
    description:
      'Evaluate communication, behavioral responses, professional experiences, and workplace scenarios using structured interview questions.',
    skills: ['Communication', 'Behavioral (STAR)', 'Leadership', 'Workplace Scenarios'],
  },
]

export default function InterviewLandingPage() {
  const navigate = useNavigate()
  const { data: historyItems, isLoading: isLoadingHistory } = useInterviewHistory()

  const handleLaunchTrack = (track: PracticeTrack) => {
    navigate('/interview/setup', {
      state: {
        presetDifficulty: track.difficulty,
        presetRounds: track.rounds,
        presetDuration: track.duration,
      },
    })
  }

  const renderTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CODING':
        return <Code2 className="w-4 h-4 text-[#2563EB]" />
      case 'SYSTEM_DESIGN':
        return <Cpu className="w-4 h-4 text-[#2563EB]" />
      case 'BEHAVIORAL':
      case 'HR':
        return <Users className="w-4 h-4 text-[#2563EB]" />
      default:
        return <Video className="w-4 h-4 text-[#2563EB]" />
    }
  }

  const renderStatusBadge = (status: string) => {
    const s = status?.toUpperCase()
    if (s === 'COMPLETED' || s === 'REPORT_GENERATED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Completed
        </span>
      )
    }
    if (s === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          In Progress
        </span>
      )
    }
    if (s === 'PAUSED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          Paused
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        {status}
      </span>
    )
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Video className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
            <span className="font-sans">Interview Studio</span>
            <span className="text-border">•</span>
            <span className="text-[#080908] dark:text-[#CDF22B] font-semibold">Active Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
            Technical Interview Simulator
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Practice multi-round technical, live coding, and behavioral interviews grounded in your verified candidate profile.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/interview/setup')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#CDF22B] hover:bg-[#bce022] active:scale-[0.98] text-[#080908] font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex-shrink-0 shadow-2xs"
        >
          <PlayCircle className="w-4 h-4 text-[#080908]" />
          <span>Configure custom interview</span>
        </button>
      </div>

      {/* ── System Status & Capabilities Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Assessment Engine</span>
            <span className="text-[11px] font-mono font-medium text-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#080908] dark:text-[#CDF22B]" />
              Ready
            </span>
          </div>
          <p className="text-sm font-heading font-bold text-foreground">
            4-Dimension Evaluation
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Technical accuracy, completeness, clarity, and structured problem-solving scores generated per answer.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Interaction Modes</span>
            <span className="text-[11px] font-mono text-muted-foreground">STT / TTS / Code</span>
          </div>
          <p className="text-sm font-heading font-bold text-foreground">
            Voice & Chat Workspaces
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real-time speech recognition, browser speech synthesis, and live editor with test execution.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Context Grounding</span>
            <span className="text-[11px] font-mono text-muted-foreground">RAG Snapshot</span>
          </div>
          <p className="text-sm font-heading font-bold text-foreground">
            Resume Profile Grounded
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Adaptive questions targeted to your actual verified skills, projects, and target role level.
          </p>
        </div>
      </div>

      {/* ── Curated Practice Tracks ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
              Curated Practice Tracks
            </h2>
            <p className="text-xs text-muted-foreground">
              Standardized engineering interview configurations with predetermined scope and duration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_TRACKS.map((track) => (
            <div
              key={track.id}
              className="bg-card border border-border hover:border-[#080908]/40 dark:hover:border-[#CDF22B]/40 rounded-xl p-5 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground bg-secondary-bg px-2.5 py-1 rounded-md border border-border">
                    {renderTypeIcon(track.rounds[0])}
                    <span>Practice Track</span>
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {track.duration}m
                    </span>
                    <span>•</span>
                    <span className="text-foreground font-bold">
                      {track.difficulty}
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-base text-foreground">
                  {track.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {track.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {track.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono px-2 py-0.5 bg-secondary-bg/60 text-foreground border border-border rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{track.rounds.length} {track.rounds.length === 1 ? 'Round' : 'Rounds'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchTrack(track)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#080908] hover:bg-[#1f201e] text-[#FAF8F3] dark:bg-[#FAF8F3] dark:text-[#080908] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <span>Launch Track</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#CDF22B] dark:text-[#080908]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Interview History Section ── */}
      <div className="space-y-4 pt-4 border-t border-[#E5E7EB] dark:border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-heading font-bold text-[#111827] dark:text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" />
              <span>Interview History</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Review your previous simulations, deterministic code evaluations, and score reports.
            </p>
          </div>
          {historyItems && historyItems.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              {historyItems.length} {historyItems.length === 1 ? 'session' : 'sessions'} recorded
            </span>
          )}
        </div>

        {isLoadingHistory ? (
          <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-8 text-center space-y-2.5">
            <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">Loading interview records...</p>
          </div>
        ) : !historyItems || historyItems.length === 0 ? (
          <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-8 text-center space-y-2">
            <History className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <h3 className="text-sm font-semibold text-[#111827] dark:text-foreground">No interview records yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Launch one of the curated tracks above or configure a custom interview to start building your interview history.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div
                key={item.sessionId}
                className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border hover:border-[#2563EB]/40 rounded-xl p-4 sm:p-5 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Role info, Type, Date, Duration, Questions */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {renderTypeIcon(item.interviewType)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111827] dark:text-foreground truncate">
                        {item.targetRole || 'Software Engineer'}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FAFAFA] dark:bg-secondary-bg text-[#111827] dark:text-foreground border border-[#E5E7EB] dark:border-border font-medium">
                        {item.interviewType || 'CODING'}
                      </span>
                      {renderStatusBadge(item.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>
                      {item.durationMinutes !== null && item.durationMinutes !== undefined && item.durationMinutes > 0 && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.durationMinutes}m</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {item.totalQuestions} {item.totalQuestions === 1 ? 'Question' : 'Questions'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB] dark:border-border">
                  {/* Score pill */}
                  <div className="text-right">
                    {item.overallScore !== null && item.overallScore !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="text-sm font-mono font-bold text-[#111827] dark:text-foreground">
                          {item.overallScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">
                        {item.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/interview/${item.sessionId}/review`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title="Review questions and submitted answers"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>

                    {(item.status === 'COMPLETED' || item.status === 'REPORT_GENERATED') && (
                      <button
                        type="button"
                        onClick={() => navigate(`/interview/${item.sessionId}/report`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-border hover:bg-secondary-bg text-[#111827] dark:text-foreground text-xs font-medium transition-colors cursor-pointer"
                        title="View Final Report"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="hidden sm:inline">Report</span>
                      </button>
                    )}

                    {item.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => navigate(`/interview/${item.sessionId}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#CDF22B] hover:bg-[#b8da25] text-[#080908] text-xs font-bold transition-colors cursor-pointer"
                        title="Resume Interview Session"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
