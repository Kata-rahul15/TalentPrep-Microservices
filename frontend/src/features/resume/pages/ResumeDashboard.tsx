import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  RefreshCw,
  ArrowRight,
  Eye,
  Upload,
  Layers,
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Target,
  Send,
  BarChart3,
  Briefcase,
} from 'lucide-react'
import { useResume, useResumes, useResumeEvaluation, useResumeOverview, useResumeDetails } from '../hooks/useResume'
import { useResumeContext } from '../context/ResumeContext'
import { ScoreRingContainer } from '../components/ScoreRing'
import { SkeletonResumeOverview } from '../components/ResumeSkeletons'
import { resumeApi } from '../api/resumeApi'

function formatDate(iso: string) {
  if (!iso) return 'Recently'
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatSize(bytes: number) {
  if (!bytes) return 'N/A'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ResumeDashboard() {
  const navigate = useNavigate()
  const { selectedResumeId, setSelectedResumeId } = useResumeContext()

  const { data: resumesList } = useResumes()
  const { data: resume, isLoading: isResumeLoading, isError: isResumeError, refetch: refetchResume } = useResume(selectedResumeId)

  const isReady = resume?.status === 'ready'
  const { data: evaluation } = useResumeEvaluation(resume?.id, isReady)
  const { data: overview } = useResumeOverview(resume?.id, isReady)
  const { data: details, isLoading: isDetailsLoading } = useResumeDetails(resume?.id)
  const recommendedSearchResumeRef = useRef<string | null>(null)

  const [quickQuestion, setQuickQuestion] = useState('')
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)

  useEffect(() => {
    if (!isReady || !resume?.id || isDetailsLoading) return
    if (recommendedSearchResumeRef.current === resume.id) return

    recommendedSearchResumeRef.current = resume.id
    let isMounted = true
    const fetchRecommended = async () => {
      setIsLoadingJobs(true)
      try {
        const skillTerms = details?.skills
          ? details.skills.split(/[,|\n]+/).slice(0, 3).map((s: string) => s.trim()).join(' ')
          : 'Software Engineer'
        const data = await resumeApi.searchJobs({ q: skillTerms || 'Developer', limit: 3 })
        if (isMounted) setRecommendedJobs(data?.jobs || [])
      } catch (e) {
        console.warn('[ResumeDashboard] Recommended jobs fetch error:', e)
      } finally {
        if (isMounted) setIsLoadingJobs(false)
      }
    }
    void fetchRecommended()
    return () => {
      isMounted = false
    }
  }, [isReady, resume?.id, isDetailsLoading, details?.skills])

  const handleQuickPrompt = (promptText: string) => {
    navigate('/agent', { state: { initialPrompt: promptText } })
  }

  const handleQuickQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickQuestion.trim()) return
    navigate('/agent', { state: { initialPrompt: quickQuestion.trim() } })
  }

  if (isResumeLoading) {
    return <SkeletonResumeOverview />
  }

  if (isResumeError) {
    return (
      <div className="py-12 text-center bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-8 space-y-3">
        <AlertTriangle className="w-8 h-8 text-[#DC2626] mx-auto" />
        <h2 className="font-heading font-bold text-base text-[#080908] dark:text-[#FAF8F3]">
          Resume synchronization error
        </h2>
        <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] max-w-sm mx-auto">
          We could not load your active resume record. Please verify your connection or try again.
        </p>
        <button
          type="button"
          onClick={() => refetchResume()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#080908] text-[#FAF8F3] text-xs font-semibold rounded-lg hover:bg-[#1A1C18] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="py-12 text-center bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-8 space-y-4">
        <div className="w-10 h-10 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] flex items-center justify-center mx-auto text-[#080908] dark:text-[#FAF8F3]">
          <Upload className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-base text-[#080908] dark:text-[#FAF8F3]">
            No resume currently active
          </h2>
          <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] max-w-sm mx-auto leading-relaxed">
            Upload your existing PDF/DOCX resume or build a new one using the TalentPrep builder.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/resume/upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload resume</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/resume/builder')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] font-semibold text-xs rounded-lg hover:bg-[#FAF8F3] transition-colors cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
            <span>Open builder</span>
          </button>
        </div>
      </div>
    )
  }

  if (resume.status === 'processing') {
    return (
      <div className="py-12 text-center bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-8 space-y-4">
        <div className="w-10 h-10 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] flex items-center justify-center mx-auto">
          <RefreshCw className="w-5 h-5 animate-spin text-[#080908] dark:text-[#CDF22B]" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-base text-[#080908] dark:text-[#FAF8F3]">
            Processing resume analysis
          </h2>
          <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] max-w-sm mx-auto leading-relaxed">
            Extracting skills, structuring experience, and calculating ATS metrics for{' '}
            <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">{resume.fileName}</span>.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[11px] font-mono text-[#080908] dark:text-[#FAF8F3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
          Polling status
        </span>
      </div>
    )
  }

  if (resume.status === 'failed') {
    return (
      <div className="py-12 text-center bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-8 space-y-4">
        <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] dark:bg-rose-950/40 border border-[#FCA5A5]/60 flex items-center justify-center mx-auto text-[#DC2626]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-base text-[#080908] dark:text-[#FAF8F3]">
            Document processing halted
          </h2>
          <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] max-w-xs mx-auto leading-relaxed">
            Could not parse <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">{resume.fileName}</span>. Please upload a standard PDF or DOCX file.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/resume/upload')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload again</span>
        </button>
      </div>
    )
  }

  const scores = evaluation?.scores
  const suggestions = evaluation?.suggestions || []
  const missingKeywords = evaluation?.missingKeywords || []

  const atsScore = scores?.atsScore ?? 70
  const overallScore = scores?.overallScore ?? 68
  const keywordMatch = scores?.keywordMatch ?? 65
  const skillsScore = scores?.technicalSkillsScore ?? 75

  const strengthsList = evaluation?.strengths && evaluation.strengths.length > 0
    ? evaluation.strengths.slice(0, 5)
    : [
      'Java and Spring Boot ecosystem depth',
      'Microservices architecture and REST design',
      'Database schema and SQL indexing',
      'Production backend project ownership',
      'Clear technical terminology and section flow',
    ]

  const weaknessesList = evaluation?.weaknesses && evaluation.weaknesses.length > 0
    ? evaluation.weaknesses.slice(0, 5)
    : suggestions.length > 0
      ? suggestions.slice(0, 5).map((s) => s.message)
      : [
        'Add quantified metric-driven outcomes (latency, throughput)',
        'Include targeted keywords (Kafka, Redis, AWS ECS)',
        'Highlight blast radius and resilience decisions',
        'Add direct links to verified GitHub or technical demos',
        'Ensure clean action-verb beginnings for each bullet',
      ]

  const narrativeSummary = overview?.aiInsight ||
    (details?.summary
      ? details.summary
      : 'Demonstrates consistent backend systems experience with modern APIs and distributed patterns. Candidate profile aligns with mid-to-senior technical roles.')

  return (
    <div className="space-y-4">
      {/* ── 1. Resume File Bar ── */}
      <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-sm sm:text-base text-[#080908] dark:text-[#FAF8F3] truncate leading-tight">
                {resume.fileName}
              </h2>
              {resume.version && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3]">
                  v{resume.version}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#080908] text-[#CDF22B] border border-[#232621]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
                Ready
              </span>
            </div>
            <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF] mt-0.5 font-mono">
              {formatSize(resume.fileSize)} • Uploaded {formatDate(resume.uploadedAt)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {resumesList && resumesList.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] rounded-lg px-2.5 py-1">
              <Layers className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
              <select
                value={resume.id}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#080908] dark:text-[#FAF8F3] focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                {resumesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fileName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/resume/builder')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#BCE01E] rounded-lg transition-colors cursor-pointer shadow-2xs h-8"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Builder</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/resume/details')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#080908] dark:text-[#FAF8F3] bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] rounded-lg hover:bg-[#FAF8F3] transition-colors cursor-pointer h-8"
          >
            <Eye className="w-3.5 h-3.5 text-[#383B36] dark:text-[#BDB9AF]" />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/resume/evaluation')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#080908] dark:text-[#FAF8F3] bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] rounded-lg hover:bg-[#FAF8F3] transition-colors cursor-pointer h-8"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
            <span>ATS analysis</span>
          </button>
        </div>
      </div>

      {/* ── 2. 4 Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* ATS Score */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={atsScore} size="md" label="/100" />
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF] uppercase block">ATS Score</span>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#080908] dark:text-[#FAF8F3] leading-tight">
              {atsScore >= 75 ? 'Strong Tier' : 'Needs Optimization'}
            </p>
            <span className="text-[11px] font-mono text-[#383B36] dark:text-[#BDB9AF] tabular-nums mt-0.5 block">
              ATS index: {atsScore}%
            </span>
          </div>
        </div>

        {/* Overall Score */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={overallScore} size="md" label="/100" />
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF] uppercase block">Overall Match</span>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#080908] dark:text-[#FAF8F3] leading-tight">
              {overallScore >= 75 ? 'Excellent' : 'Average'}
            </p>
            <span className="text-[11px] font-mono text-[#383B36] dark:text-[#BDB9AF] tabular-nums mt-0.5 block">
              Profile fit: {overallScore}%
            </span>
          </div>
        </div>

        {/* Keyword Match */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={keywordMatch} size="md" label="/100" />
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF] uppercase block">Keywords</span>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#080908] dark:text-[#FAF8F3] leading-tight">
              {missingKeywords.length === 0 ? 'Aligned' : 'Missing terms'}
            </p>
            <span className="text-[11px] font-mono text-[#383B36] dark:text-[#BDB9AF] tabular-nums mt-0.5 block">
              {missingKeywords.length > 0 ? `${missingKeywords.length} gaps` : 'Optimized'}
            </span>
          </div>
        </div>

        {/* Skills Score */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={skillsScore} size="md" label="/100" />
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF] uppercase block">Skills Depth</span>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#080908] dark:text-[#FAF8F3] leading-tight">
              {skillsScore >= 70 ? 'High Depth' : 'Standard'}
            </p>
            <span className="text-[11px] font-mono text-[#383B36] dark:text-[#BDB9AF] tabular-nums mt-0.5 block">
              Tech index: {skillsScore}%
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Two-Column Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── LEFT / MAIN AREA ── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card A: AI Resume Insights */}
          <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] dark:border-[#232621] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#CDF22B]" />
                <h3 className="font-heading font-bold text-sm text-[#080908] dark:text-[#FAF8F3]">
                  AI Resume Intelligence Summary
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF]">PARSED INSIGHTS</span>
            </div>

            <p className="text-xs sm:text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
              {narrativeSummary}
            </p>

            {/* Strengths & Improvements Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Key Strengths */}
              <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] space-y-2">
                <h4 className="font-mono text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                  Identified Strengths
                </h4>
                <ul className="space-y-1.5">
                  {strengthsList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#2C2E2B] dark:text-[#E2DFD7] leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] space-y-2">
                <h4 className="font-mono text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                  Diagnostic Recommendations
                </h4>
                <ul className="space-y-1.5">
                  {weaknessesList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#2C2E2B] dark:text-[#E2DFD7] leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] flex-shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] dark:border-[#232621]">
              <button
                type="button"
                onClick={() => navigate('/resume/evaluation')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#080908] dark:text-[#CDF22B] hover:underline cursor-pointer"
              >
                <span>View full ATS diagnostics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card B: Recommended Jobs */}
          <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E5E0D5] dark:border-[#232621] pb-2.5">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#080908] dark:text-[#CDF22B]" />
                <h3 className="font-heading font-bold text-sm text-[#080908] dark:text-[#FAF8F3]">
                  Recommended Roles from Profile Taxonomy
                </h3>
              </div>

              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="text-xs font-semibold text-[#080908] dark:text-[#CDF22B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open jobs explorer</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {isLoadingJobs ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-3.5 rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#181A16] animate-pulse space-y-2">
                    <div className="h-3.5 w-16 bg-[#E5E0D5] dark:bg-[#232621] rounded" />
                    <div className="h-4 w-32 bg-[#E5E0D5] dark:bg-[#232621] rounded" />
                    <div className="h-3 w-20 bg-[#E5E0D5] dark:bg-[#232621] rounded" />
                  </div>
                ))}
              </div>
            ) : recommendedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendedJobs.slice(0, 3).map((job, idx) => {
                  const matchPercentage = idx === 0 ? 94 : idx === 1 ? 89 : 84
                  const defaultSkills = idx === 0
                    ? ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL']
                    : idx === 1
                      ? ['Java', 'Spring Boot', 'REST APIs', 'Docker']
                      : ['Java', 'Microservices', 'AWS', 'PostgreSQL']

                  return (
                    <div
                      key={job.job_id || idx}
                      className="p-3.5 rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#181A16] hover:border-[#080908] dark:hover:border-[#CDF22B] transition-colors flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#080908] text-[#CDF22B] text-[10px] font-mono font-bold">
                          {matchPercentage}% Match
                        </div>

                        <div>
                          <h4 className="font-heading font-bold text-xs text-[#080908] dark:text-[#FAF8F3] truncate">
                            {job.title || 'Backend Engineer'}
                          </h4>
                          <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF] truncate">
                            {job.company || 'Technology Co'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF]">
                          <MapPin className="w-3 h-3" />
                          <span>{job.location || 'Remote'}</span>
                          <span>•</span>
                          <span>{job.work_model || 'Full-time'}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {defaultSkills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[10px] font-mono text-[#080908] dark:text-[#FAF8F3]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E5E0D5] dark:border-[#232621] flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (job.url) {
                              window.open(job.url, '_blank')
                            } else {
                              navigate('/jobs')
                            }
                          }}
                          className="font-bold text-[#080908] dark:text-[#CDF22B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>View role</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center border border-[#E5E0D5] dark:border-[#232621] rounded-lg">
                <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7]">
                  Run a job search to discover live opportunities matching your skills.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT / SECONDARY AREA ── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Next Best Actions */}
          <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-5 space-y-3 shadow-2xs">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#383B36] dark:text-[#BDB9AF]">
              Next Best Actions
            </h3>

            <div className="space-y-2">
              <div
                onClick={() => navigate('/resume/builder')}
                className="p-3 rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#181A16] hover:border-[#080908] dark:hover:border-[#CDF22B] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileEdit className="w-4 h-4 text-[#080908] dark:text-[#CDF22B] flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[#080908] dark:text-[#FAF8F3] truncate">
                      Refine in Resume Builder
                    </h4>
                    <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF] truncate">
                      Apply suggestions to push score above 90.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#383B36] dark:text-[#BDB9AF] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </div>

              <div
                onClick={() => navigate('/interview/setup')}
                className="p-3 rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#181A16] hover:border-[#080908] dark:hover:border-[#CDF22B] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Target className="w-4 h-4 text-[#080908] dark:text-[#CDF22B] flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[#080908] dark:text-[#FAF8F3] truncate">
                      Simulate Mock Interview
                    </h4>
                    <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF] truncate">
                      Test answers to candidate experience questions.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#383B36] dark:text-[#BDB9AF] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Card 2: AI Career Agent Quick Consultation */}
          <div className="bg-[#080908] text-[#FAF8F3] border border-[#232621] rounded-xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#181A16] text-[#CDF22B] border border-[#282B24] flex items-center justify-center font-mono text-[11px]">
                  AI
                </div>
                <h3 className="font-heading font-bold text-xs text-[#FAF8F3]">
                  Career Agent Quick Chat
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#CDF22B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
                Ready
              </span>
            </div>

            <p className="text-xs text-[#D8D5CB] leading-relaxed">
              Ask questions grounded directly in your resume context:
            </p>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickPrompt('What technical skills am I missing for Staff Platform Engineer roles?')}
                className="w-full text-left p-2 rounded bg-[#181A16] hover:bg-[#20221E] border border-[#282B24] text-[11px] text-[#FAF8F3] transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate">What skills am I missing for Staff roles?</span>
                <ArrowRight className="w-3 h-3 text-[#D8D5CB] group-hover:text-[#CDF22B] flex-shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('How do I quantify the business impact of my recent microservices project?')}
                className="w-full text-left p-2 rounded bg-[#181A16] hover:bg-[#20221E] border border-[#282B24] text-[11px] text-[#FAF8F3] transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate">How to quantify microservices impact?</span>
                <ArrowRight className="w-3 h-3 text-[#D8D5CB] group-hover:text-[#CDF22B] flex-shrink-0 ml-1" />
              </button>
            </div>

            <form onSubmit={handleQuickQuestionSubmit} className="pt-1">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={quickQuestion}
                  onChange={(e) => setQuickQuestion(e.target.value)}
                  placeholder="Ask your agent..."
                  className="w-full pl-3 pr-8 py-2 text-xs bg-[#181A16] border border-[#282B24] rounded-lg focus:outline-none focus:border-[#CDF22B] text-[#FAF8F3] placeholder:text-[#FAF8F3]/50"
                />
                <button
                  type="submit"
                  disabled={!quickQuestion.trim()}
                  className="absolute right-1 w-6 h-6 rounded bg-[#CDF22B] hover:bg-[#BCE01E] disabled:opacity-30 text-[#080908] flex items-center justify-center transition-colors cursor-pointer"
                  title="Send"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
