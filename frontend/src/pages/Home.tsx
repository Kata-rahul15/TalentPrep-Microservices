import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Briefcase, ArrowRight, Sparkles, Upload, Video } from 'lucide-react'
import { useAuth } from '@/services/authService'
import { useResume, useResumeEvaluation } from '@/features/resume/hooks/useResume'
import homeIllustration from '@/assets/home-illustration.png'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: resume } = useResume()
  const { data: evaluation } = useResumeEvaluation(resume?.id, resume?.status === 'ready')

  // Clean user display name (e.g. "Rahul1213" -> "Rahul")
  const displayName = React.useMemo(() => {
    if (!user?.username) return 'User'
    const cleaned = user.username.replace(/[0-9_.]/g, ' ').trim()
    const firstWord = cleaned.split(/\s+/)[0]
    if (!firstWord) return user.username
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
  }, [user?.username])

  const atsScore = evaluation?.scores?.atsScore

  return (
    <div className="flex-1 w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-5 space-y-5 flex flex-col justify-between">
      {/* ── Hero Section (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Side: Greeting & Description */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-7 space-y-1"
        >
          <p className="font-heading font-bold text-sm sm:text-base text-slate-700 dark:text-slate-300 tracking-tight">
            Welcome back,
          </p>

          <div className="relative inline-flex items-center gap-2">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-blue-600 dark:text-blue-500 tracking-tight leading-tight">
              {displayName}
            </h1>
            <Sparkles className="w-5 h-5 text-blue-500 fill-blue-500 flex-shrink-0 -mt-2" />
          </div>

          <div className="pt-1">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
              Let's continue your interview preparation journey and achieve your dream job.
            </p>

            {/* Subtle decorative brush stroke */}
            <svg
              className="w-16 sm:w-20 h-2 text-blue-500/70 stroke-current mt-1.5"
              viewBox="0 0 120 12"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M3,9 C30,3 70,11 117,4" />
            </svg>
          </div>
        </motion.div>

        {/* Right Side: Illustration Asset */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="lg:col-span-5 flex justify-center lg:justify-end"
        >
          <img
            src={homeIllustration}
            alt="Interview Preparation Illustration"
            className="w-full max-w-[220px] sm:max-w-[260px] h-auto object-contain pointer-events-none select-none drop-shadow-2xs"
          />
        </motion.div>
      </div>

      {/* ── Action Section (Resume & Interview Cards) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* 1. Resume Action Card */}
        <div
          onClick={() => navigate('/resume')}
          className="bg-gradient-to-br from-blue-50/70 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:to-blue-950/30 border border-blue-100/90 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between gap-3.5 z-10 relative">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100/90 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-200/50 dark:border-blue-800/50 shadow-2xs">
                <FileText className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                  Resume
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed max-w-xs">
                  Optimize your resume, get AI feedback, and improve your ATS score.
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-150 flex-shrink-0">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Decorative wave graphic at card bottom */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full h-8 text-blue-200/35 dark:text-blue-900/20 pointer-events-none"
            viewBox="0 0 500 80"
            preserveAspectRatio="none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M0,40 Q125,70 250,30 T500,40" />
            <path d="M0,55 Q125,25 250,55 T500,50" opacity="0.6" />
          </svg>
        </div>

        {/* 2. Interview Action Card */}
        <div
          onClick={() => navigate('/interview')}
          className="bg-gradient-to-br from-blue-50/70 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:to-blue-950/30 border border-blue-100/90 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between gap-3.5 z-10 relative">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100/90 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-200/50 dark:border-blue-800/50 shadow-2xs">
                <Video className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                  AI Interview Studio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed max-w-xs">
                  Practice live technical, coding, and behavioral interviews with instant AI feedback.
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-150 flex-shrink-0">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Decorative wave graphic at card bottom */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full h-8 text-blue-200/35 dark:text-blue-900/20 pointer-events-none"
            viewBox="0 0 500 80"
            preserveAspectRatio="none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M0,40 Q125,70 250,30 T500,40" />
            <path d="M0,55 Q125,25 250,55 T500,50" opacity="0.6" />
          </svg>
        </div>
      </motion.div>

      {/* ── Recent Activity Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-extrabold text-sm sm:text-base text-foreground">
              Recent Activity & Status
            </h3>
          </div>
          <button
            onClick={() => navigate('/resume')}
            className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Real activity list derived from backend session state */}
        <div className="space-y-2.5">
          {resume ? (
            <>
              <div className="p-3 sm:p-3.5 rounded-xl bg-secondary-bg/60 border border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Resume File Parsed</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {resume.fileName} • {atsScore !== undefined ? `ATS Score: ${atsScore}/100` : `Status: ${resume.status}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/resume/details')}
                  className="px-3 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:bg-secondary-bg transition-colors cursor-pointer h-7.5"
                >
                  Inspect Details
                </button>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-secondary-bg/60 border border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Job Match Analysis Available</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Compare your active resume against target job postings
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/resume/job-match')}
                  className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer h-7.5"
                >
                  Run Job Match
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-secondary-bg/40 border border-border text-center space-y-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-foreground">No active resume uploaded yet</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Upload your resume to get real-time ATS scoring, parsed details, and job description matching.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => navigate('/resume/upload')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer h-8"
                >
                  Upload Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
