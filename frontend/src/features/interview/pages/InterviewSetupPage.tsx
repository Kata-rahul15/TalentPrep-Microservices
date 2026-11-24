import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Layers,
  Clock,
  AlertTriangle,
  Play,
  Briefcase,
  MessageSquare,
  Mic,
  Code2,
  Check,
  X,
} from 'lucide-react'
import { useInterviewSetup, useCreateInterviewSession } from '../hooks/useInterview'
import { useResumes } from '@/features/resume/hooks/useResume'
import { useResumeContext } from '@/features/resume/context/ResumeContext'
import CandidateSummaryCard from '../components/CandidateSummaryCard'
import InterviewTypeSelector from '../components/InterviewTypeSelector'
import JobRoleAutocomplete from '../components/JobRoleAutocomplete'
import type {
  DifficultyLevel,
  InterviewMode,
  InterviewInteractionMode,
  RoundType,
} from '../types/interview.types'
import { getErrorMessage } from '@/services/authService'

const SUPPORTED_INTERVIEW_TYPES: RoundType[] = [
  'TECHNICAL',
  'SYSTEM_DESIGN',
  'BEHAVIORAL',
  'CODING',
]

const STANDARD_DURATIONS = [15, 30, 45, 60]
const CODING_DURATIONS = [15, 30, 45, 60, 90]

function resolveInitialInterviewType(presetRounds?: RoundType[]): RoundType {
  const first = presetRounds?.[0]
  if (first && SUPPORTED_INTERVIEW_TYPES.includes(first)) {
    return first
  }
  return 'TECHNICAL'
}

export default function InterviewSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const preset =
    (location.state as {
      presetRole?: string
      presetDifficulty?: DifficultyLevel
      presetRounds?: RoundType[]
      presetDuration?: number
    } | null) || {}

  const { selectedResumeId, setSelectedResumeId } = useResumeContext()
  const { data: resumesList } = useResumes()

  // Clear any previous active session ID on setup mount so entering setup begins fresh
  useEffect(() => {
    sessionStorage.removeItem('talentprep_active_session_id')
  }, [])

  // Identify selected resume if available in the list
  const validSelectedResume = useMemo(
    () =>
      resumesList?.find((r) => r.id === selectedResumeId) ||
      resumesList?.[0] ||
      undefined,
    [resumesList, selectedResumeId]
  )

  // Fetch setup details immediately using selectedResumeId or backend active default;
  // do not block setup on the independent resumes list fetch.
  const {
    data: setupData,
    isLoading: isSetupLoading,
    isError: isSetupError,
  } = useInterviewSetup(selectedResumeId || undefined)

  useEffect(() => {
    console.info('[InterviewSetup] Frontend initialization attempt: resumeId =', selectedResumeId || setupData?.resumeId)
  }, [selectedResumeId, setupData?.resumeId])

  const createSessionMutation = useCreateInterviewSession()
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activeIdempotencyKeyRef = useRef<string | null>(null)

  const [selectedType, setSelectedType] = useState<RoundType>(() =>
    resolveInitialInterviewType(preset.presetRounds)
  )
  const [roleDraft, setRoleDraft] = useState<string | null>(
    preset.presetRole ?? null
  )
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    preset.presetDifficulty || 'MEDIUM'
  )
  const [interactionMode, setInteractionMode] = useState<InterviewInteractionMode>('CHAT')
  const [durationMinutes, setDurationMinutes] = useState<number>(
    preset.presetDuration || 45
  )
  const [jobDescription, setJobDescription] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showResumeModal, setShowResumeModal] = useState(false)

  // Clear idempotency key whenever candidate intentionally changes configuration
  useEffect(() => {
    activeIdempotencyKeyRef.current = null
  }, [selectedType, roleDraft, difficulty, interactionMode, durationMinutes, jobDescription, selectedResumeId])

  // Derive effective role cleanly without calling setState inside useEffect
  const effectiveTargetRole =
    roleDraft !== null ? roleDraft : setupData?.targetRole || ''

  const durationOptions =
    selectedType === 'CODING' ? CODING_DURATIONS : STANDARD_DURATIONS

  const handleSelectInterviewType = (nextType: RoundType) => {
    setSelectedType(nextType)
    if (nextType !== 'CODING' && durationMinutes === 90) {
      setDurationMinutes(60)
    }
  }

  const handleCreateSession = async () => {
    if (isSubmittingRef.current || createSessionMutation.isPending) {
      return
    }

    setErrorMsg(null)

    const trimmedRole = effectiveTargetRole.trim()
    if (!trimmedRole) {
      setErrorMsg('Please select or enter a target job role.')
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      const modeToSend: InterviewMode = interactionMode === 'VOICE' ? 'VOICE' : 'TEXT'
      if (!activeIdempotencyKeyRef.current) {
        activeIdempotencyKeyRef.current =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `ik-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
      const idempotencyKey = activeIdempotencyKeyRef.current

      const session = await createSessionMutation.mutateAsync({
        resumeId: setupData?.resumeId || validSelectedResume?.id || undefined,
        difficulty,
        mode: modeToSend,
        rounds: [selectedType],
        targetRole: trimmedRole,
        targetJobDescription: jobDescription.trim() || undefined,
        durationMinutes,
        idempotencyKey,
      })

      // On successful creation, reset the idempotency key for any future session
      activeIdempotencyKeyRef.current = null

      // Persist chosen interaction mode and active session in sessionStorage
      if (session?.id) {
        sessionStorage.setItem(`tp_interaction_mode_${session.id}`, interactionMode)
        sessionStorage.setItem('talentprep_active_session_id', session.id)
      }

      navigate(`/interview/${session.id}`)
    } catch (err: unknown) {
      console.error('Failed to create interview session:', err)
      const sanitized = getErrorMessage(err)
      setErrorMsg(
        sanitized || 'Failed to create interview session. Please try again.'
      )
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate('/interview')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Interview studio</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Configure Interview Session
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Select round type, target role, difficulty, duration, and response mode.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="font-semibold">Unable to create session</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {isSetupError && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Resume context could not be loaded. You can still configure your target role, round type, and difficulty below.
          </span>
        </div>
      )}

      {/* ── Resume Context Overview ── */}
      <CandidateSummaryCard
        setupData={setupData}
        isLoading={isSetupLoading}
        resumeTitle={validSelectedResume?.fileName}
        hasResumes={Boolean(resumesList && resumesList.length > 0)}
        onChangeResumeClick={() => setShowResumeModal(true)}
      />

      {/* ── Configuration Form Panel ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
        {/* 1. Interview Type Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>1. Interview Round Type</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Single round
            </span>
          </div>
          <InterviewTypeSelector
            value={selectedType}
            onChange={handleSelectInterviewType}
          />
        </div>

        {/* 2. Target Job Role & Optional JD */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>2. Target Role & Context</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Target Role *
              </label>
              <JobRoleAutocomplete
                value={effectiveTargetRole}
                onChange={(val) => setRoleDraft(val)}
                additionalSuggestions={setupData?.availableTargetRoles}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Type to filter suggested roles or enter a custom title.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Job Description{' '}
                <span className="text-slate-400 font-normal">(Optional context)</span>
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities or tech stack requirements to tailor questions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 3. Difficulty & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
              3. Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as DifficultyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${difficulty === level
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                >
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>4. Duration</span>
            </label>
            <div
              className={`grid gap-2 ${durationOptions.length === 5 ? 'grid-cols-5' : 'grid-cols-4'
                }`}
            >
              {durationOptions.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${durationMinutes === mins
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Timer tracks active turns, pause intervals, and auto wrap-up.
            </p>
          </div>
        </div>

        {/* 4. Interaction Mode */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>5. Response Mode</span>
            </h2>
            {selectedType === 'CODING' && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Code editor active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Chat-Based Interview */}
            <button
              type="button"
              onClick={() => setInteractionMode('CHAT')}
              className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-3 ${interactionMode === 'CHAT'
                ? 'bg-slate-50 dark:bg-slate-800/90 border-blue-600 dark:border-blue-500 shadow-2xs'
                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${interactionMode === 'CHAT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Chat Mode
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                    Text
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Type your answers with markdown and code snippets support.
                </p>
              </div>
            </button>

            {/* Voice-Based Interview */}
            <button
              type="button"
              onClick={() => setInteractionMode('VOICE')}
              className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-3 ${interactionMode === 'VOICE'
                ? 'bg-slate-50 dark:bg-slate-800/90 border-blue-600 dark:border-blue-500 shadow-2xs'
                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${interactionMode === 'VOICE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <Mic className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Voice Mode
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                    Audio STT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hear questions aloud, speak your response, and review live transcription.
                </p>
              </div>
            </button>
          </div>

          {selectedType === 'CODING' && (
            <p className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Coding rounds automatically open the live sandbox workspace with syntax highlighting and tests.</span>
            </p>
          )}
        </div>

        {/* ── Submit Action ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Session opens in a prepared lobby.
          </span>

          <button
            type="button"
            onClick={handleCreateSession}
            disabled={createSessionMutation.isPending || isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
          >
            {createSessionMutation.isPending || isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Session...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Interview</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Change Resume Modal ── */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Select Active Resume Context
              </h3>
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {resumesList && resumesList.length > 0 ? (
                resumesList.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedResumeId(r.id)
                      setShowResumeModal(false)
                    }}
                    className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${(selectedResumeId === r.id || (!selectedResumeId && (r as { isPrimary?: boolean }).isPrimary))
                      ? 'bg-slate-50 dark:bg-slate-800 border-blue-600 dark:border-blue-500 font-medium'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <p className="text-slate-900 dark:text-slate-100 font-medium truncate">{r.fileName}</p>
                      <p className="text-slate-400 text-[11px] font-mono">
                        {new Date(r.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {(selectedResumeId === r.id || (!selectedResumeId && (r as { isPrimary?: boolean }).isPrimary)) && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No uploaded resumes found.
                </p>
              )}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
