import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Briefcase,
  ArrowRight,
  Video,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/services/authService'
import { useResume, useResumeEvaluation } from '@/features/resume/hooks/useResume'
import { useInterviewSetup } from '@/features/interview/hooks/useInterview'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: resume } = useResume()
  const { data: evaluation } = useResumeEvaluation(resume?.id, resume?.status === 'ready')
  const { data: setupData } = useInterviewSetup(resume?.id, Boolean(resume?.id))

  const displayName = React.useMemo(() => {
    if (!user?.username) return 'there'
    const cleaned = user.username.replace(/[0-9_.]/g, ' ').trim()
    const firstWord = cleaned.split(/\s+/)[0]
    if (!firstWord) return user.username
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
  }, [user?.username])

  const atsScore = evaluation?.scores?.atsScore

  return (
    <div className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex flex-col justify-start max-w-7xl mx-auto">
      
      {/* ── Dashboard Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E0D5] dark:border-[#232621]">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#080908] dark:text-[#FAF8F3] tracking-tight">
            Welcome back, {displayName}.
          </h1>
          <p className="text-sm sm:text-base text-[#2C2E2B] dark:text-[#E2DFD7] mt-1">
            Your next opportunity starts here.
          </p>
        </div>

        {/* Small secondary ATS Score indicator when available */}
        {atsScore !== undefined ? (
          <div className="flex items-center gap-3 self-start sm:self-auto px-3.5 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#121311] border border-[#080908]/15 dark:border-[#232621] shadow-2xs">
            <span className="text-xs font-semibold text-[#383B36] dark:text-[#BDB9AF]">
              ATS Score:
            </span>
            <span className="font-mono font-bold text-sm text-[#080908] dark:text-[#FAF8F3] tabular-nums">
              {atsScore} / 100
            </span>
          </div>
        ) : user?.email ? (
          <span className="text-xs text-[#383B36] dark:text-[#BDB9AF] font-mono self-start sm:self-auto">
            {user.email}
          </span>
        ) : null}
      </div>

      {/* ── Three Primary Action Cards (Main Focus) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Card 1: Resume Analysis */}
        <div className="rounded-xl border border-[#080908]/12 dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] p-6 flex flex-col justify-between shadow-xs hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-sm">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#383B36] dark:text-[#BDB9AF]">
                01
              </span>
            </div>

            <div>
              <h2 className="font-heading font-black text-xl text-[#080908] dark:text-[#FAF8F3]">
                Resume Analysis
              </h2>
              <p className="mt-2 text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                Review your resume and discover where you can improve.
              </p>
            </div>

            {/* Resume State / Data */}
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] space-y-2 text-xs">
              {resume ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#383B36] dark:text-[#BDB9AF]">File</span>
                    <span className="font-bold text-[#080908] dark:text-[#FAF8F3] truncate max-w-[170px]" title={resume.fileName}>
                      {resume.fileName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#383B36] dark:text-[#BDB9AF]">ATS Score</span>
                    <span className="font-mono font-bold text-[#080908] dark:text-[#FAF8F3]">
                      {atsScore !== undefined ? `${atsScore} / 100` : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#383B36] dark:text-[#BDB9AF]">Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#15803D] dark:text-[#CDF22B]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {resume.status === 'ready' ? 'Ready' : resume.status}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center space-y-1">
                  <p className="font-semibold text-[#080908] dark:text-[#FAF8F3]">
                    No resume uploaded yet
                  </p>
                  <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF]">
                    Upload a PDF or DOCX to unlock ATS scoring.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E0D5] dark:border-[#232621]">
            <button
              type="button"
              onClick={() => navigate(resume ? '/resume' : '/resume/upload')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#CDF22B] hover:bg-[#BCE01E] active:scale-[0.98] text-[#080908] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span>{resume ? 'View Analysis' : 'Upload Resume'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Interview Preparation */}
        <div className="rounded-xl border border-[#080908]/12 dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] p-6 flex flex-col justify-between shadow-xs hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-sm">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#383B36] dark:text-[#BDB9AF]">
                02
              </span>
            </div>

            <div>
              <h2 className="font-heading font-black text-xl text-[#080908] dark:text-[#FAF8F3]">
                Interview Preparation
              </h2>
              <p className="mt-2 text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                Practice interviews and improve your technical confidence.
              </p>
            </div>

            {/* Interview State / Data */}
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#383B36] dark:text-[#BDB9AF]">Tracks</span>
                <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">
                  Technical, Coding, System Design, HR
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#383B36] dark:text-[#BDB9AF]">Format</span>
                <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">
                  Voice & Real-time Code Runner
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#383B36] dark:text-[#BDB9AF]">Session Status</span>
                <span className="font-mono text-[#080908] dark:text-[#CDF22B] font-bold">
                  {setupData?.availableSessionsRemaining !== undefined
                    ? setupData.unlimitedAccess
                      ? 'Unlimited access'
                      : `${setupData.availableSessionsRemaining} sessions available`
                    : 'Ready to start'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E0D5] dark:border-[#232621]">
            <button
              type="button"
              onClick={() => navigate('/interview')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#CDF22B] hover:bg-[#BCE01E] active:scale-[0.98] text-[#080908] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span>Start Interview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Job Matching */}
        <div className="rounded-xl border border-[#080908]/12 dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] p-6 flex flex-col justify-between shadow-xs hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#383B36] dark:text-[#BDB9AF]">
                03
              </span>
            </div>

            <div>
              <h2 className="font-heading font-black text-xl text-[#080908] dark:text-[#FAF8F3]">
                Job Matching
              </h2>
              <p className="mt-2 text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                Find opportunities that fit your skills and experience.
              </p>
            </div>

            {/* Job Matching State / Data */}
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#383B36] dark:text-[#BDB9AF]">Matching Status</span>
                <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">
                  {resume ? 'Active Compatibility Engine' : 'Awaiting Resume'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#383B36] dark:text-[#BDB9AF]">Target Criteria</span>
                <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">
                  Remote & Hybrid Technical Roles
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#383B36] dark:text-[#BDB9AF]">Ranked By</span>
                <span className="font-mono text-[#080908] dark:text-[#CDF22B] font-bold">
                  Skill Density Match
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E0D5] dark:border-[#232621]">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#CDF22B] hover:bg-[#BCE01E] active:scale-[0.98] text-[#080908] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span>Explore Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
