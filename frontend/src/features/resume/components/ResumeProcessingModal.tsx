import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
  ShieldCheck,
  Brain,
  Layers,
} from 'lucide-react'
import { useResumeContext } from '../context/ResumeContext'
import { resumeApi } from '../api/resumeApi'
import { useQueryClient } from '@tanstack/react-query'
import { resumeKeys } from '../hooks/useResume'
import { cn } from '@/lib/utils'

const POLLING_INTERVAL_MS = 2500
const TIMEOUT_DURATION_MS = 3 * 60 * 1000 // 3 minutes

export default function ResumeProcessingModal() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    isModalOpen,
    setIsModalOpen,
    activeUpload,
    updateUploadState,
    setSelectedResumeId,
    resetUpload,
  } = useResumeContext()

  const [, setPollingErrorCount] = useState(0)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [stageProgress, setStageProgress] = useState(1) // 1 to 4

  const startTimeRef = useRef<number>(Date.now())
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { status, resumeId, uploadProgress, error, file } = activeUpload

  // Reset timers on modal open
  useEffect(() => {
    if (isModalOpen) {
      startTimeRef.current = Date.now()
      setIsTimedOut(false)
      setPollingErrorCount(0)
    }
  }, [isModalOpen])

  // Informational stage animation simulation (visual feedback during processing)
  useEffect(() => {
    if (status !== 'processing') return

    const t1 = setTimeout(() => setStageProgress(2), 2000)
    const t2 = setTimeout(() => setStageProgress(3), 5000)
    const t3 = setTimeout(() => setStageProgress(4), 9000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [status])

  // Terminal status completion handler (READY)
  const handleReadyCompletion = useCallback(
    async (targetId: string) => {
      try {
        console.log('[Modal] Fetching details, overview, and ATS analysis for canonical resume ID:', targetId)

        // Pre-fetch all required endpoints in parallel for exact targetId
        const [details, overview, evaluation] = await Promise.allSettled([
          resumeApi.getResumeDetails(targetId),
          resumeApi.getResumeOverview(targetId),
          resumeApi.getAtsAnalysis(targetId),
        ])

        console.log('[Modal] Results fetched:', { details, overview, evaluation })

        // Update React Query cache for exact resume ID
        queryClient.invalidateQueries({ queryKey: resumeKeys.all })
        if (details.status === 'fulfilled') {
          queryClient.setQueryData(resumeKeys.details(targetId), details.value)
        }
        if (overview.status === 'fulfilled') {
          queryClient.setQueryData(resumeKeys.overview(targetId), overview.value)
        }
        if (evaluation.status === 'fulfilled') {
          queryClient.setQueryData(resumeKeys.evaluation(targetId), evaluation.value)
        }

        // Set selected resume ID in state and localStorage
        setSelectedResumeId(targetId)
        updateUploadState({ status: 'ready', stage: 'ready' })

        // Immediate close and navigate (no artificial delay)
        setIsModalOpen(false)
        navigate('/resume/details', { replace: true })
      } catch (err) {
        console.error('[Modal] Error fetching results after READY status:', err)
        setSelectedResumeId(targetId)
        updateUploadState({ status: 'ready', stage: 'ready' })
        setIsModalOpen(false)
        navigate('/resume/details', { replace: true })
      }
    },
    [navigate, queryClient, setSelectedResumeId, setIsModalOpen, updateUploadState]
  )

  // Status Polling Loop
  const pollStatus = useCallback(async () => {
    if (!resumeId || status !== 'processing') return

    // Clear existing timer if any
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = null
    }

    // Check timeout
    if (Date.now() - startTimeRef.current > TIMEOUT_DURATION_MS) {
      setIsTimedOut(true)
    }

    try {
      console.log('[Modal] Polling GET /api/resumes/' + resumeId)
      const resumeFile = await resumeApi.getResumeById(resumeId)
      console.log('[Modal] Polling result for ID:', resumeId, 'status:', resumeFile?.status, 'rawStatus:', resumeFile?.rawStatus)

      setPollingErrorCount(0)

      const normStatus = String(resumeFile?.status || '').toLowerCase()
      const rawStatusUpper = String(resumeFile?.rawStatus || '').toUpperCase().trim()

      const isStatusReady = normStatus === 'ready' || ['READY', 'COMPLETED', 'SUCCESS'].includes(rawStatusUpper)
      const isStatusFailed = normStatus === 'failed' || ['FAILED', 'ERROR', 'FAILED_PARSING', 'FAILED_ANALYSIS', 'INVALID'].includes(rawStatusUpper)

      if (isStatusReady) {
        if (pollingTimerRef.current) {
          clearTimeout(pollingTimerRef.current)
          pollingTimerRef.current = null
        }
        await handleReadyCompletion(resumeId)
      } else if (isStatusFailed) {
        if (pollingTimerRef.current) {
          clearTimeout(pollingTimerRef.current)
          pollingTimerRef.current = null
        }
        updateUploadState({
          status: 'failed',
          stage: 'failed',
          error: 'Your resume could not be fully processed. Please try again with another document.',
        })
      } else {
        // Still processing (UPLOADING / PROCESSING) - schedule next poll
        pollingTimerRef.current = setTimeout(pollStatus, POLLING_INTERVAL_MS)
      }
    } catch (err: any) {
      console.warn('[Modal] Status polling network glitch:', err)
      setPollingErrorCount((prev) => prev + 1)
      // On temporary network glitch, schedule retry without marking failed
      pollingTimerRef.current = setTimeout(pollStatus, POLLING_INTERVAL_MS + 1000)
    }
  }, [resumeId, status, handleReadyCompletion, updateUploadState])

  // Trigger status polling when processing starts with resumeId
  useEffect(() => {
    if (status === 'processing' && resumeId) {
      pollStatus()
    }
    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
    }
  }, [status, resumeId, pollStatus])

  if (!isModalOpen) return null

  const isUploading = status === 'uploading'
  const isProcessing = status === 'processing'
  const isReady = status === 'ready'
  const isFailed = status === 'failed'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Blurred & Dimmed Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8"
        >
          {/* Header icon badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors',
                  isReady
                    ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/50'
                    : isFailed
                    ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-950/50'
                    : 'bg-blue-600/10 text-blue-600 dark:bg-blue-950/50'
                )}
              >
                {isUploading && <Upload className="w-6 h-6 animate-bounce text-blue-600" />}
                {isProcessing && <Brain className="w-6 h-6 animate-pulse text-blue-600 dark:text-blue-400" />}
                {isReady && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                {isFailed && <AlertTriangle className="w-6 h-6 text-rose-500" />}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {isUploading
                    ? 'Step 1 of 2'
                    : isProcessing
                    ? 'Step 2 of 2'
                    : isReady
                    ? 'Complete'
                    : 'Error'}
                </span>
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white leading-snug">
                  {isUploading && 'Uploading your resume'}
                  {isProcessing && 'Resume uploaded successfully!'}
                  {isReady && 'Analysis Complete!'}
                  {isFailed && 'Resume analysis could not be completed'}
                </h3>
              </div>
            </div>

            {isFailed && (
              <button
                onClick={resetUpload}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Subtitle / Message */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {isUploading && 'Please wait while we securely upload your document to our encrypted servers.'}
            {isProcessing && 'Now extracting your information and analyzing your resume with AI. This may take a few moments.'}
            {isReady && 'Your resume data has been parsed and evaluated. Loading your results dashboard...'}
            {isFailed && (error || 'Your resume could not be fully processed. Please try again.')}
          </p>

          {/* Selected File Card snippet */}
          {file && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(0)} KB • {file.type.includes('word') ? 'DOCX' : 'PDF'}
                </p>
              </div>
              {isUploading && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {uploadProgress}%
                </span>
              )}
            </div>
          )}

          {/* ── State A: Genuine Upload Progress ── */}
          {isUploading && (
            <div className="space-y-3">
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(uploadProgress, 8)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure SSL Upload
                </span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}

          {/* ── State B & C: Processing Stage Indicators ── */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {/* Stage 1 */}
                <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Resume uploaded</span>
                  </div>
                  <span className="text-[11px] font-normal">Completed</span>
                </div>

                {/* Stage 2 */}
                <div
                  className={cn(
                    'flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl transition-colors border',
                    stageProgress >= 2
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200/40 dark:border-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {stageProgress >= 2 ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span>Extracting resume content</span>
                  </div>
                  <span className="text-[11px] font-normal">
                    {stageProgress >= 2 ? 'In progress...' : 'Pending'}
                  </span>
                </div>

                {/* Stage 3 */}
                <div
                  className={cn(
                    'flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl transition-colors border',
                    stageProgress >= 3
                      ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200/40 dark:border-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {stageProgress >= 3 ? (
                      <Sparkles className="w-4 h-4 text-purple-600 animate-pulse flex-shrink-0" />
                    ) : (
                      <Brain className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span>Analyzing with AI</span>
                  </div>
                  <span className="text-[11px] font-normal">
                    {stageProgress >= 3 ? 'Analyzing...' : 'Pending'}
                  </span>
                </div>

                {/* Stage 4 */}
                <div
                  className={cn(
                    'flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl transition-colors border',
                    stageProgress >= 4
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200/40 dark:border-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {stageProgress >= 4 ? (
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span>Preparing your results</span>
                  </div>
                  <span className="text-[11px] font-normal">
                    {stageProgress >= 4 ? 'Finalizing...' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>Polling status from server...</span>
                </div>

                {isTimedOut && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Taking longer than expected...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── State D: Ready ── */}
          {isReady && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-emerald-800 dark:text-emerald-300">
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
              <div className="text-xs font-medium">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Results loaded!</p>
                <p>Opening your detailed dashboard...</p>
              </div>
            </div>
          )}

          {/* ── State E: Failed ── */}
          {isFailed && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <p className="font-bold text-rose-900 dark:text-rose-200">Processing Failed</p>
                <p>{error || 'An error occurred while processing your resume.'}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={resetUpload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Try New Upload</span>
                </button>
                {resumeId && (
                  <button
                    onClick={pollStatus}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Status Check</span>
                  </button>
                )}
                <button
                  onClick={resetUpload}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
