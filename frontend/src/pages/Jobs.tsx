import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import {
  Briefcase,
  Search,
  MapPin,
  ExternalLink,
  Sparkles,
  Clock,
  Filter,
  AlertCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useResume, useResumeDetails } from '@/features/resume/hooks/useResume'
import { useResumeContext } from '@/features/resume/context/ResumeContext'
import { resumeApi } from '@/features/resume/api/resumeApi'
import { SkeletonJobList } from '@/features/resume/components/ResumeSkeletons'
import { cn } from '@/lib/utils'

interface JobListing {
  job_id: string
  title: string
  company: string
  location: string
  work_model?: string
  employment_type?: string
  url?: string
  description?: string
  posted_date?: string
  salary?: string
  skills_required?: string[]
}

interface SearchParams {
  q: string
  location: string
  days: number
}

interface ActiveSearch {
  params: SearchParams
  controller: AbortController
}

function JobsExplorerInner() {
  const navigate = useNavigate()
  const { selectedResumeId } = useResumeContext()
  const { data: selectedResume, isLoading: isResumeLoading } = useResume(selectedResumeId)
  const { data: resumeDetails, isLoading: isResumeDetailsLoading } = useResumeDetails(selectedResumeId)

  // Candidate parsed skills for instant match calculation
  const candidateSkills = useMemo(() => {
    if (!resumeDetails?.skills) return []
    return resumeDetails.skills
      .split(/[,|\n]+/)
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean)
  }, [resumeDetails?.skills])

  // Search & Filter state
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [days, setDays] = useState(30)
  const [workModelFilter, setWorkModelFilter] = useState<'ALL' | 'Remote' | 'Hybrid' | 'On-site'>('ALL')

  // Results & Loading
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track active in-flight search request and AbortController
  const inFlightRef = useRef<ActiveSearch | null>(null)

  // Selected job for detailed inspection
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)

  const performSearch = useCallback(async (searchParams: SearchParams) => {
    const normalizedParams: SearchParams = {
      q: searchParams.q.trim(),
      location: searchParams.location.trim(),
      days: searchParams.days,
    }

    // Prevent duplicate request if an identical search is currently running
    if (
      inFlightRef.current &&
      inFlightRef.current.params.q === normalizedParams.q &&
      inFlightRef.current.params.location === normalizedParams.location &&
      inFlightRef.current.params.days === normalizedParams.days
    ) {
      return
    }

    // Cancel obsolete in-flight request when a newer search replaces it
    if (inFlightRef.current) {
      inFlightRef.current.controller.abort()
      inFlightRef.current = null
    }

    const controller = new AbortController()
    inFlightRef.current = {
      params: normalizedParams,
      controller,
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await resumeApi.searchJobs(
        {
          q: normalizedParams.q || undefined,
          location: normalizedParams.location || undefined,
          days: normalizedParams.days,
          limit: 20,
        },
        controller.signal
      )

      if (controller.signal.aborted) {
        return
      }

      const fetchedJobs: JobListing[] = data?.jobs || []
      setJobs(fetchedJobs)
      setSelectedJob((prev) => {
        if (prev && fetchedJobs.some((j) => j.job_id === prev.job_id)) {
          return prev
        }
        return fetchedJobs[0] || null
      })
    } catch (err: any) {
      if (axios.isCancel(err) || err?.name === 'CanceledError' || controller.signal.aborted) {
        // Request was replaced or aborted; ignore without setting error state
        return
      }
      console.error('[JobsExplorer] Search failed:', err)
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch jobs. Please verify search parameters or network connectivity.'
      )
      setJobs([])
    } finally {
      // Only clear loading state if this specific controller is still the active one
      if (inFlightRef.current?.controller === controller) {
        inFlightRef.current = null
        setIsLoading(false)
      }
    }
  }, [])

  // Initial automatic search on component mount with proper AbortController cleanup
  useEffect(() => {
    if (isResumeLoading) return
    if (selectedResume?.status === 'ready' && isResumeDetailsLoading) return

    const defaultQuery = resumeDetails?.summary
      ? 'Software Engineer Developer'
      : candidateSkills.slice(0, 3).join(' ') || 'Software Engineer'

    const initialParams: SearchParams = {
      q: defaultQuery,
      location: 'India',
      days: 30,
    }

    setQuery(initialParams.q)
    setLocation(initialParams.location)
    setDays(initialParams.days)

    performSearch(initialParams)

    return () => {
      if (inFlightRef.current) {
        inFlightRef.current.controller.abort()
        inFlightRef.current = null
      }
    }
  }, [
    isResumeLoading,
    selectedResume?.status,
    isResumeDetailsLoading,
    resumeDetails?.summary,
    candidateSkills,
    performSearch,
  ])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch({
      q: query,
      location,
      days,
    })
  }

  const handleDaysChange = (newDays: number) => {
    setDays(newDays)
    performSearch({
      q: query,
      location,
      days: newDays,
    })
  }

  // Filtered jobs by work model
  const filteredJobs = useMemo(() => {
    if (workModelFilter === 'ALL') return jobs
    return jobs.filter((job) => {
      const model = (job.work_model || '').toLowerCase()
      if (workModelFilter === 'Remote') return model.includes('remote')
      if (workModelFilter === 'Hybrid') return model.includes('hybrid')
      if (workModelFilter === 'On-site') return model.includes('on-site') || model.includes('onsite') || model.includes('office')
      return true
    })
  }, [jobs, workModelFilter])

  // Calculate matching score & matched skills for a job
  const getJobMatchAnalysis = (job: JobListing) => {
    if (candidateSkills.length === 0) return { score: 75, matched: [], missing: [] }

    const jobText = `${job.title} ${job.description || ''} ${(job.skills_required || []).join(' ')}`.toLowerCase()

    const matched: string[] = []
    const missing: string[] = []

    candidateSkills.forEach((skill) => {
      if (jobText.includes(skill)) {
        matched.push(skill)
      }
    })

    // Approximate score based on match count
    const ratio = matched.length / Math.max(candidateSkills.length * 0.4, 1)
    const score = Math.min(Math.max(Math.round(55 + ratio * 40), 60), 96)

    return { score, matched: matched.slice(0, 5), missing: missing.slice(0, 3) }
  }

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <Briefcase className="w-3.5 h-3.5" />
            <span>TALENTPREP JOB EXPLORER</span>
          </div>
          <h1 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight leading-tight">
            Job Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            Search, discover, and match with opportunities aligned with your skills and experience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/agent?task=find_jobs')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all shadow-2xs cursor-pointer h-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Find Jobs For Me</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* Query input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by job title, technologies, or keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Location input */}
          <div className="md:col-span-3 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State, or Country"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Timeframe */}
          <div className="md:col-span-2 relative">
            <select
              value={days}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border disabled:border-border disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer h-full"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Explore Jobs</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Work Model:
            </span>
            {(['ALL', 'Remote', 'Hybrid', 'On-site'] as const).map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => setWorkModelFilter(model)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer',
                  workModelFilter === model
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/60 dark:border-blue-800 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {model === 'ALL' ? 'All Models' : model}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500">
            Showing <strong className="text-slate-900 dark:text-white">{filteredJobs.length}</strong> opportunities
          </div>
        </div>
      </form>

      {/* ── Error message ── */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Two-Column Jobs Master-Detail Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left List of Jobs */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {isLoading ? (
            <SkeletonJobList />
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No jobs found</p>
              <p className="text-[11px] text-slate-500">Try broadening your search term or adjusting filters.</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const analysis = getJobMatchAnalysis(job)
              const isSelected = selectedJob?.job_id === job.job_id

              return (
                <div
                  key={job.job_id}
                  onClick={() => setSelectedJob(job)}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden',
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                          {job.title}
                        </h3>
                        {job.work_model && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {job.work_model}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        {job.company}
                      </p>
                    </div>

                    {/* Match Gauge Pill */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 flex-shrink-0 text-[11px] font-bold">
                      <span>{analysis.score}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location}
                    </span>
                    {job.posted_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {job.posted_date}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Selected Job Detailed View */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xs sticky top-4 min-h-[500px]">
          {selectedJob ? (
            <div className="space-y-4">
              {/* Job Header */}
              <div className="flex items-start justify-between flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                      {selectedJob.title}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-900">
                      LIVE
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {selectedJob.company} • {selectedJob.location}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                    {selectedJob.work_model && (
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
                        {selectedJob.work_model}
                      </span>
                    )}
                    {selectedJob.employment_type && (
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
                        {selectedJob.employment_type}
                      </span>
                    )}
                    {selectedJob.salary && (
                      <span className="text-emerald-600 font-semibold text-[11px]">
                        {selectedJob.salary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedJob.url && (
                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs h-8"
                    >
                      <span>Apply on Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (selectedJob.description) {
                        navigate('/agent?task=match_jd', { state: { jdText: selectedJob.description } })
                      } else {
                        navigate('/agent?task=match_jd', { state: { jdText: `${selectedJob.title} at ${selectedJob.company}\nLocation: ${selectedJob.location}` } })
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors h-8"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Match with AI</span>
                  </button>
                </div>
              </div>

              {/* Match Insights Breakdown Box */}
              {candidateSkills.length > 0 && (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Resume Match Analysis</span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      {getJobMatchAnalysis(selectedJob).score}% Compatibility
                    </span>
                  </div>

                  {getJobMatchAnalysis(selectedJob).matched.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">Matching Skills:</span>
                      {getJobMatchAnalysis(selectedJob).matched.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Job Description Body */}
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Job Description & Qualifications
                </h3>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-[420px] overflow-y-auto whitespace-pre-line p-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 rounded-lg">
                  {selectedJob.description ||
                    'Detailed description is available via the direct application link above.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
              <Briefcase className="w-8 h-8 opacity-40" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select a job from the list to view specifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Jobs() {
  return (
    <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-5">
      <JobsExplorerInner />
    </div>
  )
}
