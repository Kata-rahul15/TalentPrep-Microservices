import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Tag,
  Lightbulb,
  Loader2,
  Circle,
  AlertCircle,
  FileSearch,
  Brain,
  Search,
  Sparkles,
  Calculator,
  RotateCcw,
} from 'lucide-react'

import {
  useJobMatch,
  useJobMatchStatus,
  useResume,
} from '../hooks/useResume'

import {
  Button,
} from '../components/ResumeUI'

import { ScoreRingContainer } from '../components/ScoreRing'
import SkillBadge from '../components/SkillBadge'

import type {
  JobMatchStatus,
  JobMatchStatusResponse,
} from '../types/resume.types'

// ─────────────────────────────────────────────────────────────
// Placeholder
// ─────────────────────────────────────────────────────────────

const PLACEHOLDER = `Paste a job description here to match it against your resume...

Example:
We are looking for a Senior Java Backend Engineer with strong experience in Spring Boot and microservices architecture. The ideal candidate will have hands-on experience with Apache Kafka, Redis caching, Docker containerization, and Kubernetes orchestration.`

// ─────────────────────────────────────────────────────────────
// Status configuration (6 Stages)
// ─────────────────────────────────────────────────────────────

const STATUS_STEPS: {
  status: JobMatchStatus | 'PREPARING_JD' | 'PREPARING_RESULTS'
  label: string
  description: string
  icon: typeof Brain
}[] = [
  {
    status: 'PREPARING_JD',
    label: '1. Preparing job description',
    description: 'Validating and formatting job description input.',
    icon: FileSearch,
  },
  {
    status: 'QUEUED',
    label: '2. Analyzing resume information',
    description: 'Parsing skills, work history, and education context.',
    icon: Brain,
  },
  {
    status: 'ANALYZING_JOB',
    label: '3. Extracting job requirements',
    description: 'Identifying key technical skills, experience levels, and keywords.',
    icon: Search,
  },
  {
    status: 'RETRIEVING_EVIDENCE',
    label: '4. Comparing skills and experience',
    description: 'Cross-referencing resume qualifications with job specifications.',
    icon: Sparkles,
  },
  {
    status: 'EVALUATING_MATCH',
    label: '5. Generating match analysis',
    description: 'Calculating keyword coverage and identifying qualification gaps.',
    icon: Calculator,
  },
  {
    status: 'CALCULATING_SCORE',
    label: '6. Preparing final results',
    description: 'Finalizing recommendations and overall fit score.',
    icon: CheckCircle2,
  },
]

function getStatusIndex(status?: JobMatchStatus): number {
  if (!status) return 0
  if (status === 'COMPLETED') return STATUS_STEPS.length - 1
  if (status === 'QUEUED') return 1
  if (status === 'ANALYZING_JOB') return 2
  if (status === 'RETRIEVING_EVIDENCE') return 3
  if (status === 'EVALUATING_MATCH') return 4
  if (status === 'CALCULATING_SCORE') return 5
  return 0
}

function getStatusTitle(status?: JobMatchStatus): string {
  switch (status) {
    case 'QUEUED':
      return 'Analyzing resume information'
    case 'ANALYZING_JOB':
      return 'Extracting job requirements'
    case 'RETRIEVING_EVIDENCE':
      return 'Comparing skills and experience'
    case 'EVALUATING_MATCH':
      return 'Generating match analysis'
    case 'CALCULATING_SCORE':
      return 'Preparing final results'
    case 'COMPLETED':
      return 'Match analysis complete'
    case 'FAILED':
      return 'Match analysis failed'
    default:
      return 'Preparing job description'
  }
}

// ─────────────────────────────────────────────────────────────
// Progress UI
// ─────────────────────────────────────────────────────────────

interface MatchProgressProps {
  status?: JobMatchStatus
  errorMessage?: string | null
  elapsedSeconds?: number
}

function MatchProgress({
  status,
  errorMessage,
  elapsedSeconds = 0,
}: MatchProgressProps) {
  const currentIndex = getStatusIndex(status)
  const isFailed = status === 'FAILED'
  const isCompleted = status === 'COMPLETED'

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remaining = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-2xs scroll-mt-24"
    >
      <div aria-live="polite" className="sr-only">
        {isFailed
          ? `Match analysis failed: ${errorMessage || 'Unknown error'}`
          : isCompleted
            ? 'Match analysis completed successfully'
            : `Processing stage: ${getStatusTitle(status)}`}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isFailed
                ? 'bg-danger/10 text-danger'
                : isCompleted
                  ? 'bg-success/10 text-success'
                  : 'bg-primary/10 text-primary'
            }`}
          >
            {isFailed ? (
              <AlertCircle className="w-4 h-4" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </div>

          <div>
            <h2 className="font-heading font-bold text-sm sm:text-base text-foreground">
              {getStatusTitle(status)}
            </h2>

            <p className="text-xs text-muted-foreground mt-0.5">
              {isFailed
                ? 'Something went wrong while processing your match.'
                : isCompleted
                  ? 'Your resume has been successfully compared with the job description.'
                  : 'AI matching is in progress. Please stay on this page.'}
            </p>
          </div>
        </div>

        {/* Elapsed Timer Badge */}
        {!isCompleted && !isFailed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-bg border border-border text-[11px] font-mono text-muted-foreground flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        )}
      </div>

      {/* Progress steps */}
      {!isFailed && (
        <div className="space-y-0.5">
          {STATUS_STEPS.map((step, index) => {
            const Icon = step.icon
            const isCurrent = index === currentIndex && !isCompleted
            const isDone = isCompleted || index < currentIndex
            const isUpcoming = !isDone && !isCurrent

            return (
              <div key={step.label} className="relative flex gap-3">
                {/* Vertical line */}
                {index < STATUS_STEPS.length - 1 && (
                  <div
                    className={`absolute left-[14px] top-8 w-px h-[calc(100%-2px)] ${
                      isDone ? 'bg-success/40' : 'bg-border'
                    }`}
                  />
                )}

                {/* Step icon */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    isDone
                      ? 'bg-success/10 border-success/30 text-success'
                      : isCurrent
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-muted/30 border-border text-muted-foreground/50'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Icon className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-2.5 h-2.5" />
                  )}
                </div>

                {/* Step content */}
                <div className={`pb-3 flex-1 ${isUpcoming ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? 'text-primary'
                          : isDone
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>

                    {isCurrent && (
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Failed message */}
      {isFailed && (
        <div className="mt-3 p-3 rounded-lg bg-danger/5 border border-danger/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-danger">
                Match processing failed
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {errorMessage ||
                  'The server could not complete the job match. Your input has been preserved below.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Result Panel
// ─────────────────────────────────────────────────────────────

interface ResultPanelProps {
  result: JobMatchStatusResponse
}

function ResultPanel({ result }: ResultPanelProps) {
  const overallMatch = result.overallMatch ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3.5"
    >
      {/* Overall score */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
        <ScoreRingContainer
          score={overallMatch}
          size="lg"
          label="Match"
        />

        <div className="flex-1 text-center sm:text-left">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">
            Job Description Match
          </p>

          <p
            className={`font-heading font-black text-2xl mb-0.5 ${overallMatch >= 80
              ? 'text-success'
              : overallMatch >= 60
                ? 'text-warning'
                : 'text-danger'
              }`}
          >
            {overallMatch}%
          </p>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {overallMatch >= 80
              ? 'Your resume closely aligns with the supplied job requirements.'
              : overallMatch >= 60
                ? 'Your resume has several matching requirements, with some gaps to review.'
                : 'Your resume has several gaps compared with the supplied job requirements.'}
          </p>
        </div>
      </div>

      {/* Matched + Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Matched */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Matched Skills</span>
            <span className="ml-auto text-[11px] text-success font-semibold">
              {result.matchedSkills.length} found
            </span>
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {result.matchedSkills.length > 0 ? (
              result.matchedSkills.map((skill) => (
                <SkillBadge key={skill} label={skill} variant="matched" />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No matched skills identified.</p>
            )}
          </div>
        </div>

        {/* Missing */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
            <XCircle className="w-3.5 h-3.5 text-danger" />
            <span>Missing Skills</span>
            <span className="ml-auto text-[11px] text-danger font-semibold">
              {result.missingSkills.length} gaps
            </span>
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {result.missingSkills.length > 0 ? (
              result.missingSkills.map((skill) => (
                <SkillBadge key={skill} label={skill} variant="missing" />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No missing skills identified.</p>
            )}
          </div>
        </div>
      </div>

      {/* Missing keywords */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
          <Tag className="w-3.5 h-3.5 text-warning" />
          <span>Missing Keywords</span>
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {result.missingKeywords.length > 0 ? (
            result.missingKeywords.map((keyword) => (
              <SkillBadge key={keyword} label={keyword} variant="missing" size="sm" />
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No missing keywords identified.</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
          <Lightbulb className="w-3.5 h-3.5 text-primary" />
          <span>Recommendations</span>
        </h3>

        {result.recommendations.length > 0 ? (
          <ul className="space-y-1.5">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-secondary-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No additional recommendations were generated.</p>
        )}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function JobMatch() {
  const navigate = useNavigate()
  const [jobDescription, setJobDescription] = useState('')
  const [activeMatchId, setActiveMatchId] = useState<string | undefined>()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const progressSectionRef = useRef<HTMLDivElement>(null)
  const resultSectionRef = useRef<HTMLDivElement>(null)
  const errorSectionRef = useRef<HTMLDivElement>(null)

  // Fetch resume
  const { data: resume, isLoading: isResumeLoading } = useResume()

  // Start matching mutation
  const jobMatchMutation = useJobMatch()

  // Poll background match status
  const jobMatchStatusQuery = useJobMatchStatus(resume?.id, activeMatchId)
  const status = jobMatchStatusQuery.data?.status
  const isProcessing = Boolean(activeMatchId) && status !== 'COMPLETED' && status !== 'FAILED'

  // Timer counter during processing
  useEffect(() => {
    let interval: any = null
    if (isProcessing || jobMatchMutation.isPending) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isProcessing, jobMatchMutation.isPending])

  // Smooth scroll handler helper
  const scrollToElement = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  // Handle Match action
  const handleMatch = () => {
    const cleanedJobDescription = jobDescription.trim()
    if (!cleanedJobDescription || !resume?.id || isProcessing || jobMatchMutation.isPending) {
      return
    }

    setActiveMatchId(undefined)
    setElapsedSeconds(0)

    scrollToElement(progressSectionRef)

    jobMatchMutation.mutate(
      {
        input: { description: cleanedJobDescription },
        resumeId: resume.id,
      },
      {
        onSuccess: (data) => {
          setActiveMatchId(data.matchId)
        },
        onError: () => {
          scrollToElement(errorSectionRef)
        },
      }
    )
  }

  // Scroll to results when completed
  useEffect(() => {
    if (status === 'COMPLETED') {
      scrollToElement(resultSectionRef)
    } else if (status === 'FAILED') {
      scrollToElement(errorSectionRef)
    }
  }, [status])

  const handleClear = () => {
    setJobDescription('')
    setActiveMatchId(undefined)
    setElapsedSeconds(0)
    jobMatchMutation.reset()
  }

  const handleRetry = () => {
    setActiveMatchId(undefined)
    setElapsedSeconds(0)
    jobMatchMutation.reset()
  }

  const result = status === 'COMPLETED' ? jobMatchStatusQuery.data : undefined

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-heading font-black text-lg sm:text-xl text-foreground leading-tight">
              Job Description Match
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
              Compare your resume against any job description and discover where you align and where you have gaps.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Input Panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-2xs"
      >
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-primary" />
          <h2 className="font-heading font-semibold text-xs sm:text-sm text-foreground">
            Job Description
          </h2>
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={6}
          disabled={isProcessing || jobMatchMutation.isPending}
          className="w-full resize-none bg-background border border-border rounded-lg px-3 py-2.5 text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Job description text input"
        />

        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <p className="text-[11px] text-muted-foreground">
            {jobDescription.length > 0
              ? `${jobDescription.split(/\s+/).filter(Boolean).length} words`
              : 'Paste the full job description for best results'}
          </p>

          <div className="flex gap-2">
            {jobDescription && !isProcessing && !jobMatchMutation.isPending && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}

            <Button
              onClick={handleMatch}
              disabled={
                !jobDescription.trim() ||
                !resume?.id ||
                isResumeLoading ||
                jobMatchMutation.isPending ||
                isProcessing
              }
              loading={jobMatchMutation.isPending || isProcessing}
              size="md"
            >
              {jobMatchMutation.isPending
                ? 'Preparing...'
                : isProcessing
                  ? 'Analyzing Match...'
                  : isResumeLoading
                    ? 'Loading Resume...'
                    : 'Match Resume'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Progress Section Anchor */}
      <div ref={progressSectionRef} className="scroll-mt-20">
        <AnimatePresence>
          {(jobMatchMutation.isPending || (activeMatchId && status && status !== 'COMPLETED' && status !== 'FAILED')) && (
            <MatchProgress
              status={status || 'QUEUED'}
              elapsedSeconds={elapsedSeconds}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Failed state section */}
      <div ref={errorSectionRef} className="scroll-mt-20">
        <AnimatePresence>
          {status === 'FAILED' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
              <MatchProgress
                status="FAILED"
                errorMessage={jobMatchStatusQuery.data?.errorMessage}
                elapsedSeconds={elapsedSeconds}
              />
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleRetry}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status polling error */}
      {jobMatchStatusQuery.isError && (
        <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-danger mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-danger">
                Unable to retrieve match status
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                The match may still be processing. Please try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div ref={resultSectionRef} className="scroll-mt-20">
        <AnimatePresence>
          {result && <ResultPanel result={result} />}
        </AnimatePresence>
      </div>

      {/* Ready for interview CTA */}
      {result && result.overallMatch !== null && result.overallMatch >= 70 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 text-white rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap shadow-2xs"
        >
          <div>
            <p className="font-heading font-bold text-xs sm:text-sm mb-0.5">
              Ready for Interview?
            </p>
            <p className="text-slate-400 text-xs">
              Your {result.overallMatch}% match indicates strong alignment with the job requirements.
            </p>
          </div>

          <Button
            onClick={() => navigate('/interview')}
            variant="primary"
            size="sm"
          >
            Launch Interview Prep
          </Button>
        </motion.div>
      )}
    </div>
  )
}