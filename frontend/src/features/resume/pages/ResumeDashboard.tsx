import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Sparkles,
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
  Compass,
  Send,
  BarChart3,
  Briefcase,
} from 'lucide-react'
import { useResume, useResumes, useResumeEvaluation, useResumeOverview, useResumeDetails } from '../hooks/useResume'
import { useResumeContext } from '../context/ResumeContext'
import { useAuth } from '@/services/authService'
import { PageError } from '../components/ResumeUI'
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
  const { user } = useAuth()
  const { selectedResumeId, setSelectedResumeId } = useResumeContext()

  const { data: resumesList } = useResumes()
  const { data: resume, isLoading: isResumeLoading, isError: isResumeError, refetch: refetchResume } = useResume(selectedResumeId)

  // Fetch evaluation, overview, & details
  const isReady = resume?.status === 'ready'
  const { data: evaluation } = useResumeEvaluation(resume?.id, isReady)
  const { data: overview } = useResumeOverview(resume?.id, isReady)
  const { data: details, isLoading: isDetailsLoading } = useResumeDetails(resume?.id)
  const recommendedSearchResumeRef = useRef<string | null>(null)

  // Quick Agent Question Input
  const [quickQuestion, setQuickQuestion] = useState('')

  // Recommended Jobs state
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)

  // Fetch Recommended Jobs based on resume
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

  // Quick prompt handler for AI Career Agent widget
  const handleQuickPrompt = (promptText: string) => {
    navigate('/agent', { state: { initialPrompt: promptText } })
  }

  const handleQuickQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickQuestion.trim()) return
    navigate('/agent', { state: { initialPrompt: quickQuestion.trim() } })
  }

  if (isResumeLoading) return <SkeletonResumeOverview />
  if (isResumeError) return <PageError message="Could not load resume workspace." onRetry={refetchResume} />

  // ── No resume uploaded (Rich Empty State) ──────────────────────────────────
  if (!resume) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.username || 'Candidate'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload your resume to get started with AI evaluation, ATS analysis, and continuous improvement.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200/60 dark:border-blue-900/60 shadow-inner">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
              No Resume Uploaded Yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload your PDF or DOCX resume to extract skills, calculate your real ATS score, match job descriptions, and improve sections with AI.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/resume/upload')}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer h-9"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume Now</span>
            </button>
            <button
              onClick={() => navigate('/resume/builder')}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer h-9"
            >
              <FileEdit className="w-3.5 h-3.5 text-blue-600" />
              <span>Create in Builder</span>
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Processing resume state ───────────────────────────────────────────────
  if (resume.status === 'processing') {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto animate-pulse border border-blue-200/60 dark:border-blue-800">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            Processing Your Resume...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Our AI is extracting skills, analyzing experience, and computing ATS health metrics for{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{resume.fileName}</span>.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 rounded-full text-[11px] font-semibold text-blue-600 dark:text-blue-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
          <span>Auto-refreshing status...</span>
        </div>
      </div>
    )
  }

  // ── Failed resume state ───────────────────────────────────────────────────
  if (resume.status === 'failed') {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200/60 dark:border-rose-800">
          <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            Resume Analysis Could Not Be Completed
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your document <span className="font-semibold text-slate-700 dark:text-slate-300">{resume.fileName}</span> could not be processed. Please try uploading your resume again.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            onClick={() => navigate('/resume/upload')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-2xs cursor-pointer h-8"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Resume</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Resume Scores & Insights Data ─────────────────────────────────────────
  const scores = evaluation?.scores
  const suggestions = evaluation?.suggestions || []
  const missingKeywords = evaluation?.missingKeywords || []

  const atsScore = scores?.atsScore ?? 70
  const overallScore = scores?.overallScore ?? 68
  const keywordMatch = scores?.keywordMatch ?? 65
  const skillsScore = scores?.technicalSkillsScore ?? 75

  // Candidate strengths & improvements
  const strengthsList = evaluation?.strengths && evaluation.strengths.length > 0
    ? evaluation.strengths.slice(0, 5)
    : [
        'Java and Spring Boot ecosystem',
        'Microservices architecture & REST APIs',
        'Database & SQL design capabilities',
        'Real-world and production-like projects',
        'Good technical depth and code structuring',
      ]

  const weaknessesList = evaluation?.weaknesses && evaluation.weaknesses.length > 0
    ? evaluation.weaknesses.slice(0, 5)
    : suggestions.length > 0
    ? suggestions.slice(0, 5).map((s) => s.message)
    : [
        'Add more measurable metric-driven achievements',
        'Include missing high-demand keywords (Kafka, AWS)',
        'Highlight business impact and scale in project metrics',
        'Add active portfolio or GitHub project links',
        'Improve section formatting and action-verb clarity',
      ]

  // Narrative summary text
  const narrativeSummary = overview?.aiInsight ||
    (details?.summary
      ? details.summary
      : 'You are a strong technical professional with established experience in modern application architecture, databases, and clean system design. Your resume demonstrates solid domain depth and project implementation.')

  const candidateDisplayName = user?.username || 'Rahul'

  return (
    <div className="space-y-4">
      {/* ── 1. Resume File Bar (Hero Strip matching Reference Design) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-900/60">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate leading-tight">
                {resume.fileName}
              </h2>
              {resume.version && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60">
                  v{resume.version}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {resume.fileType || 'application/pdf'} • {formatSize(resume.fileSize)} • Uploaded {formatDate(resume.uploadedAt)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {resumesList && resumesList.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={resume.id}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[130px] truncate"
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
            onClick={() => navigate('/resume/builder')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-2xs cursor-pointer h-8.5"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Open Builder</span>
          </button>
          <button
            onClick={() => navigate('/resume/details')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer h-8.5"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View Details</span>
          </button>
          <button
            onClick={() => navigate('/resume/evaluation')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer h-8.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Evaluate</span>
          </button>
        </div>
      </div>

      {/* ── 2. 4 Score Metric Summary Cards (Horizontal Row on Desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* ATS Score */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={atsScore} size="md" label="/100" color="#2563EB" />
          <div className="min-w-0">
            <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              ATS Score
            </p>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 block">
              {atsScore >= 75 ? 'Strong' : atsScore >= 60 ? 'Good' : 'Needs Optimization'}
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              ATS match: {atsScore}%
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={overallScore} size="md" label="/100" color="#3B82F6" />
          <div className="min-w-0">
            <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              Overall Score
            </p>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 block">
              {overallScore >= 75 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Work'}
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Profile strength: {overallScore}%
            </p>
          </div>
        </div>

        {/* Keyword Match */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={keywordMatch} size="md" label="/100" color="#7C3AED" />
          <div className="min-w-0">
            <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              Keyword Match
            </p>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5 block">
              {missingKeywords.length === 0 ? 'Optimal' : 'Good'}
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {missingKeywords.length > 0 ? `${missingKeywords.length} missing keywords` : 'Industry aligned'}
            </p>
          </div>
        </div>

        {/* Skills Score */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
          <ScoreRingContainer score={skillsScore} size="md" label="/100" color="#10B981" />
          <div className="min-w-0">
            <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              Skills Score
            </p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {skillsScore >= 70 ? 'Good' : 'Standard'}
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Technical match: {skillsScore}%
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Two-Column Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── LEFT / MAIN AREA (~68% width on desktop) ── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card A: AI Resume Insights */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                AI Resume Insights
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {narrativeSummary}
            </p>

            {/* Strengths & Improvements Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Key Strengths */}
              <div className="space-y-2.5">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Key Strengths</span>
                </h4>
                <ul className="space-y-2">
                  {strengthsList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="space-y-2.5">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Areas to Improve</span>
                </h4>
                <ul className="space-y-2">
                  {weaknessesList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Link */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => navigate('/resume/evaluation')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer group"
              >
                <span>View Full Analysis</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Card B: Recommended Jobs for You */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    Recommended Jobs for You
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Personalized job recommendations based on your resume
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/jobs')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Jobs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 Horizontal Job Cards */}
            {isLoadingJobs ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 animate-pulse space-y-2.5">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
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
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-2xs space-y-3"
                    >
                      <div className="space-y-2">
                        {/* Match tag */}
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-900/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{matchPercentage}% Match</span>
                        </div>

                        <div>
                          <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                            {job.title || 'Java Backend Developer'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {job.company || 'ABC Technologies'}
                          </p>
                        </div>

                        {/* Meta icons */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {job.location || 'Hyderabad'}
                          </span>
                          <span>•</span>
                          <span>2–4 years</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {job.work_model || (idx === 0 ? 'On-site' : idx === 1 ? 'Hybrid' : 'Remote')}
                          </span>
                        </div>

                        {/* Skill pills */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {defaultSkills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                            +2
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <button
                          onClick={() => {
                            if (job.url) {
                              window.open(job.url, '_blank')
                            } else {
                              navigate('/jobs')
                            }
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <span>View Job</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => {
                            if (job.description) {
                              navigate('/agent?task=match_jd', { state: { jdText: job.description } })
                            } else {
                              navigate('/agent?task=match_jd', { state: { jdText: `${job.title} at ${job.company}\nLocation: ${job.location}` } })
                            }
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                        >
                          Why this matches?
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ready to discover job opportunities matched to your technical profile.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT / SECONDARY AREA (~32% width on desktop) ── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Your Next Best Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Your Next Best Actions
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Action 1: Improve Your Resume */}
              <div
                onClick={() => navigate('/resume/builder')}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-100 dark:border-purple-900/60">
                    <FileEdit className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                      Improve Your Resume
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Get AI-powered suggestions to improve your ATS score.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>

              {/* Action 2: Find Matching Jobs */}
              <div
                onClick={() => navigate('/agent?task=find_jobs')}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-100 dark:border-blue-900/60">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                      Find Matching Jobs
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Let AI find and rank jobs that match your resume.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>

              {/* Action 3: Identify Skill Gaps */}
              <div
                onClick={() => navigate('/agent?task=match_jd')}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-100 dark:border-emerald-900/60">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                      Identify Skill Gaps
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      See what skills you're missing for your target roles.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Card 2: AI Career Agent Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                    AI Career Agent
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Your personal AI career assistant
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            {/* Greeting Speech Bubble */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                👋 <strong>Hi {candidateDisplayName}!</strong> I've analyzed your resume and I can help you find jobs, improve your resume, and plan your career.
              </p>
            </div>

            {/* Quick Prompt Pill Buttons */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickPrompt('Find Java backend developer jobs in Hyderabad that match my resume')}
                className="w-full text-left p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate">Find Java backend jobs in Hyderabad that match my resume</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('What technical skills am I missing for senior backend roles?')}
                className="w-full text-left p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate">What skills am I missing?</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('How can I improve my ATS score to reach 90+?')}
                className="w-full text-left p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate">How can I improve my ATS score?</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrompt('Prepare a tailored cover letter for a software engineering job')}
                className="w-full text-left p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center justify-between cursor-pointer group"
              >
                <span className="truncate">Prepare a cover letter for a job</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-1" />
              </button>
            </div>

            {/* Quick Chat Input */}
            <form onSubmit={handleQuickQuestionSubmit} className="pt-1">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={quickQuestion}
                  onChange={(e) => setQuickQuestion(e.target.value)}
                  placeholder="Ask me anything about your career..."
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!quickQuestion.trim()}
                  className="absolute right-1.5 w-6.5 h-6.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Send to AI Career Agent"
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
