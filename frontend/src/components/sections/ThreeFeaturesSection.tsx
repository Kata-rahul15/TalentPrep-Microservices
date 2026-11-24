import { Link } from 'react-router-dom'
import {
  FileText,
  Video,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/services/authService'

export default function ThreeFeaturesSection() {
  const { user } = useAuth()

  const resumeHref = user ? '/resume' : '/signup'
  const interviewHref = user ? '/interview' : '/signup'
  const jobsHref = user ? '/jobs' : '/signup'

  return (
    <section
      id="features"
      className="py-20 md:py-28 bg-[#FFFFFF] dark:bg-[#080908] border-t border-[#E5E0D5] dark:border-[#232621] scroll-mt-20"
      aria-label="Core Capabilities"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#080908] dark:text-[#FAF8F3] tracking-tight leading-[1.12]">
            Everything You Need to Move Forward
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
            From your first resume upload to your next interview.
          </p>
        </div>

        {/* Exactly Three Primary Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* ── Card 1: Resume Analysis ── */}
          <div
            id="resume-analysis"
            className="flex flex-col justify-between rounded-xl border border-[#080908]/12 dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#121311] p-6 sm:p-7 shadow-xs hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40 transition-colors scroll-mt-24 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#383B36] dark:text-[#BDB9AF]">
                  FEATURE 01
                </span>
              </div>

              <div>
                <h3 className="font-heading font-black text-xl text-[#080908] dark:text-[#FAF8F3]">
                  Resume Analysis
                </h3>
                <p className="mt-2 text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                  Understand your resume, identify skill gaps, and improve your chances of getting shortlisted.
                </p>
              </div>

              {/* Visual: Clean resume preview with ATS score indicator */}
              <div className="rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#181A16] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E0D5] dark:border-[#232621] pb-2.5">
                  <span className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                    ATS Diagnostic Score
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#080908] text-[#CDF22B] font-mono text-xs font-bold">
                    94 / 100
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#2C2E2B] dark:text-[#E2DFD7]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#383B36] dark:text-[#BDB9AF]">Formatting & Structure</span>
                    <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">Optimal (98%)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#383B36] dark:text-[#BDB9AF]">Technical Keyword Density</span>
                    <span className="font-semibold text-[#080908] dark:text-[#FAF8F3]">Strong (92%)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E0D5] dark:border-[#232621] flex flex-wrap gap-1.5">
                  {['TypeScript', 'React', 'Distributed Systems'].map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FAF8F3] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D5] dark:border-[#232621]">
              <Link
                to={resumeHref}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#080908] dark:text-[#CDF22B] hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
              >
                <span>Explore Resume Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Card 2: Interview Preparation ── */}
          <div
            id="interview-prep"
            className="flex flex-col justify-between rounded-xl border border-[#080908]/12 dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#121311] p-6 sm:p-7 shadow-xs hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40 transition-colors scroll-mt-24 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-sm">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#383B36] dark:text-[#BDB9AF]">
                  FEATURE 02
                </span>
              </div>

              <div>
                <h3 className="font-heading font-black text-xl text-[#080908] dark:text-[#FAF8F3]">
                  Interview Preparation
                </h3>
                <p className="mt-2 text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                  Practice technical, coding, system design, and HR interviews with AI-powered feedback.
                </p>
              </div>

              {/* Visual: Simple interview question and evaluation preview */}
              <div className="rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#181A16] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#383B36] dark:text-[#BDB9AF]">SYSTEM DESIGN ROUND</span>
                  <span className="font-mono text-[#080908] dark:text-[#CDF22B] font-bold">45 min</span>
                </div>

                <p className="text-xs font-semibold text-[#080908] dark:text-[#FAF8F3] leading-snug">
                  "How would you scale a distributed cache to survive sudden node failures?"
                </p>

                <div className="p-2.5 rounded bg-[#FAF8F3] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#080908] dark:text-[#FAF8F3]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-[#CDF22B]" />
                    <span>AI Evaluation Insight:</span>
                  </div>
                  <p className="text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                    Consistent hashing highlighted well. Clarify virtual node replication strategy.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D5] dark:border-[#232621]">
              <Link
                to={interviewHref}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#080908] dark:text-[#CDF22B] hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
              >
                <span>Explore Interview Prep</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Card 3: Job Matching ── */}
          <div
            id="job-matches"
            className="flex flex-col justify-between rounded-xl border border-[#080908]/12 dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#121311] p-6 sm:p-7 shadow-xs hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40 transition-colors scroll-mt-24 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-sm">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#383B36] dark:text-[#BDB9AF]">
                  FEATURE 03
                </span>
              </div>

              <div>
                <h3 className="font-heading font-black text-xl text-[#080908] dark:text-[#FAF8F3]">
                  Job Matching
                </h3>
                <p className="mt-2 text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                  Discover opportunities that match your skills, experience, and career goals.
                </p>
              </div>

              {/* Visual: Minimal job listing preview with compatibility indicator */}
              <div className="rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#181A16] p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                      Senior Backend Engineer
                    </h4>
                    <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF] mt-0.5">
                      Stripe · Remote
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#080908] text-[#CDF22B] text-[10px] font-mono font-bold shrink-0">
                    95% Match
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-[#2C2E2B] dark:text-[#E2DFD7]">
                  <span>$150k – $190k</span>
                  <span className="text-[#383B36] dark:text-[#BDB9AF]">Full-time</span>
                </div>

                <div className="p-2 rounded bg-[#FAF8F3] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[10px] text-[#2C2E2B] dark:text-[#E2DFD7] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#080908] dark:text-[#CDF22B] shrink-0" />
                  <span>Verified overlap: Distributed Systems, API Architecture, SQL</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D5] dark:border-[#232621]">
              <Link
                to={jobsHref}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#080908] dark:text-[#CDF22B] hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
              >
                <span>Explore Job Matches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
