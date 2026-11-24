import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  FileText,
  Briefcase,
  Video,
} from 'lucide-react'

function ScoreRingMini({ score = 94 }: { score?: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-label={`ATS Score ${score}`} className="block">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#E5E0D5"
          className="dark:stroke-[#232621]"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#080908"
          className="dark:stroke-[#CDF22B]"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-mono font-bold text-xs sm:text-sm text-[#080908] dark:text-[#FAF8F3] tabular-nums">{score}</span>
        <span className="text-[7px] font-semibold text-[#383B36] dark:text-[#BDB9AF] uppercase tracking-wider">ATS</span>
      </div>
    </div>
  )
}

function HeroProductPreview() {
  return (
    <div className="w-full max-w-[540px] mx-auto lg:mx-0 select-none">
      {/* ── Main Unified Product Preview Frame ── */}
      <div className="rounded-xl border border-[#080908]/15 dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] shadow-[0_8px_30px_rgba(8,9,8,0.06)] overflow-hidden">
        {/* Workspace Window Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E0D5] dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#181A16]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E0D5] dark:bg-[#2C2F29]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E0D5] dark:bg-[#2C2F29]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E0D5] dark:bg-[#2C2F29]" />
            </div>
            <span className="text-[11px] font-semibold text-[#2C2E2B] dark:text-[#E2DFD7] ml-2">
              TalentPrep Workspace
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#080908] text-[#CDF22B] text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
            LIVE PREVIEW
          </span>
        </div>

        {/* Unified 3-Pillar Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Pillar 1: Resume Analysis Score Preview */}
          <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ScoreRingMini score={94} />
              <div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                  <span className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                    Resume Analysis
                  </span>
                </div>
                <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF] mt-0.5 leading-snug">
                  High ATS match · Formatting and skills benchmarked
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#080908] dark:text-[#CDF22B] bg-[#CDF22B]/25 dark:bg-[#CDF22B]/20 px-2 py-1 rounded">
              Ready
            </span>
          </div>

          {/* Pillar 2: Matching Job Opportunity Preview */}
          <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-xs shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                    Senior Platform Engineer
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#080908] text-[#CDF22B] font-bold">
                    96% Match
                  </span>
                </div>
                <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF] mt-0.5">
                  Stripe · Distributed Systems · Remote
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#080908] dark:text-[#FAF8F3] shrink-0">
              $150k+
            </span>
          </div>

          {/* Pillar 3: Interview Question Preview */}
          <div className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#080908] dark:text-[#FAF8F3] flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                Technical Interview · System Design
              </span>
              <span className="text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF]">
                Round 1 of 3
              </span>
            </div>
            <p className="text-xs font-medium text-[#080908] dark:text-[#FAF8F3] leading-snug">
              "How do you ensure idempotency when payment webhooks arrive concurrently under network partitions?"
            </p>
            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF] border-t border-[#E5E0D5] dark:border-[#232621]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" /> Real-time feedback enabled
              </span>
              <span className="font-bold text-[#080908] dark:text-[#CDF22B]">Clarity: 9.2/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="home" className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-[#FAF8F3] dark:bg-[#080908] scroll-mt-20" aria-label="Hero">
      {/* Background Architectural Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-grid-pattern opacity-60" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-14 xl:gap-20">
          
          {/* ── LEFT: Value Proposition ── */}
          <div className="flex-1 max-w-2xl lg:max-w-none text-left">
            {/* Headline */}
            <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] tracking-tight text-[#080908] dark:text-[#FAF8F3] leading-[1.08]">
              Your Resume. Your Role. Your Next Opportunity.
            </h1>

            {/* Supporting description */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed max-w-[52ch]">
              Analyze your resume, discover relevant job opportunities, and prepare for interviews with AI-powered guidance. Everything you need to take the next step in your career.
            </p>

            {/* CTA Button Group */}
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/signup"
                id="hero-cta-primary"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#CDF22B] hover:bg-[#BCE01E] active:scale-[0.98] text-[#080908] font-bold text-sm sm:text-base rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-it-works"
                id="hero-cta-secondary"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-[#080908] dark:text-[#FAF8F3] hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C18] font-semibold text-sm sm:text-base rounded-lg border border-[#E5E0D5] dark:border-[#232621] transition-all cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span>Explore How It Works</span>
              </a>
            </div>

            {/* Proof bar */}
            <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#2C2E2B] dark:text-[#E2DFD7]">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                Resume Analysis
              </span>
              <span className="w-1 h-1 rounded-full bg-[#080908]/20 dark:bg-[#FAF8F3]/20" />
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                Job Matching
              </span>
              <span className="w-1 h-1 rounded-full bg-[#080908]/20 dark:bg-[#FAF8F3]/20" />
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                Interview Preparation
              </span>
            </div>
          </div>

          {/* ── RIGHT: Realistic Unified Product Preview ── */}
          <div className="mt-12 lg:mt-0 flex-1 flex items-center justify-center lg:justify-end">
            <HeroProductPreview />
          </div>

        </div>
      </div>
    </section>
  )
}
