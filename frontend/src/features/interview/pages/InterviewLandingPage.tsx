import { useNavigate } from 'react-router-dom'
import {
  Video,
  PlayCircle,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import type { DifficultyLevel, RoundType } from '../types/interview.types'

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
    id: 'fullstack-dev',
    title: 'Full Stack Developer',
    category: 'Technical Interview',
    duration: 45,
    difficulty: 'HARD',
    rounds: ['TECHNICAL'],
    description: 'REST APIs, microservice architectures, React state patterns, databases, and your resume projects.',
    skills: ['React / TypeScript', 'Spring Boot / Node', 'SQL / Redis', 'Architecture'],
  },
  {
    id: 'backend-eng',
    title: 'Backend Engineer',
    category: 'System Design',
    duration: 45,
    difficulty: 'MEDIUM',
    rounds: ['SYSTEM_DESIGN'],
    description: 'Idempotent APIs, distributed caching, database indexing, partitioning, and resilience patterns.',
    skills: ['Distributed Systems', 'PostgreSQL', 'Kafka', 'Caching'],
  },
  {
    id: 'coding-algorithms',
    title: 'Software Engineer',
    category: 'Coding Round',
    duration: 60,
    difficulty: 'HARD',
    rounds: ['CODING'],
    description: 'Algorithmic problem-solving with test cases and multi-dimensional AI code evaluation.',
    skills: ['Algorithms', 'Data Structures', 'Optimization', 'Clean Code'],
  },
  {
    id: 'behavioral-leadership',
    title: 'Senior Software Engineer',
    category: 'HR Interview',
    duration: 30,
    difficulty: 'MEDIUM',
    rounds: ['BEHAVIORAL'],
    description: 'Situational leadership, ownership examples, and conflict resolution using the STAR framework.',
    skills: ['Communication', 'Leadership', 'Conflict Resolution', 'Ownership'],
  },
]

export default function InterviewLandingPage() {
  const navigate = useNavigate()

  const handleLaunchTrack = (track: PracticeTrack) => {
    navigate('/interview/setup', {
      state: {
        presetRole: track.title,
        presetDifficulty: track.difficulty,
        presetRounds: track.rounds,
        presetDuration: track.duration,
      },
    })
  }

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Interview Studio</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Technical Interview Simulator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Practice multi-round technical, live coding, and behavioral interviews grounded in your verified candidate profile.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/interview/setup')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors cursor-pointer flex-shrink-0"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Configure Custom Interview</span>
        </button>
      </div>

      {/* ── System Status & Capabilities Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Assessment Engine</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            4-Dimension Evaluation
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Technical accuracy, completeness, clarity, and structured problem-solving scores generated per answer.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Interaction Modes</span>
            <span className="text-[11px] font-mono text-slate-400">STT / TTS / Code</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Voice & Chat Workspaces
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Real-time speech recognition, browser speech synthesis, and live editor with test execution.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Context Grounding</span>
            <span className="text-[11px] font-mono text-slate-400">RAG Snapshot</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Resume Profile Grounded
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Adaptive questions targeted to your actual verified skills, projects, and target role level.
          </p>
        </div>
      </div>

      {/* ── Curated Practice Tracks ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Curated Practice Tracks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standardized engineering interview configurations with predetermined scope and duration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_TRACKS.map((track) => (
            <div
              key={track.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {track.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {track.duration}m
                    </span>
                    <span>•</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {track.difficulty}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                  {track.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {track.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {track.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{track.rounds.length} {track.rounds.length === 1 ? 'Round' : 'Rounds'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchTrack(track)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <span>Launch Track</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
