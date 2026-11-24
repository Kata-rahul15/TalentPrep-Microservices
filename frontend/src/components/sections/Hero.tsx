import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  FileText,
  Search,
  Bot,
  Zap,
  Briefcase,
  TrendingUp,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   ATS Score Gauge SVG Component
   ───────────────────────────────────────────── */
function ScoreRingMini({ score = 92 }: { score?: number }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="relative flex items-center justify-center">
      <svg width="68" height="68" viewBox="0 0 68 68" aria-label={`ATS Score ${score}`} className="block">
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-border"
        />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="#2563EB"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 34 34)"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-heading font-extrabold text-base text-foreground">{score}</span>
        <span className="text-[8px] font-bold text-primary uppercase tracking-wider">ATS</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Hero Visual / Layered Product Story Composition
   Resume → AI Intelligence → Job Search → Career Agent
   ───────────────────────────────────────────── */
function HeroProductComposition() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto lg:mx-0 select-none" aria-hidden="true">
      {/* Background ambient lighting */}
      <div className="absolute -inset-6 rounded-3xl bg-primary/10 dark:bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-6 w-56 h-56 bg-info/10 rounded-full blur-2xl pointer-events-none" />

      {/* ── Main Center Panel: AI Career Agent & Workspace ── */}
      <div className="relative rounded-2xl border border-border bg-card shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08),_0_8px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5),_0_8px_24px_-4px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Window Chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary-bg/80 backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
            <span className="ml-2.5 text-[11px] font-semibold text-foreground/80 tracking-tight flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-primary" />
              TalentPrep Workspace
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Context Synced
          </span>
        </div>

        {/* Panel Content */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Active Context Banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-[11px]">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="font-semibold text-foreground truncate max-w-[200px]">
                Senior_Engineer_Resume.pdf
              </span>
            </div>
            <span className="text-[10px] font-bold text-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Parsed & Ready
            </span>
          </div>

          {/* AI Career Agent Message Stream Preview */}
          <div className="space-y-2.5 text-[11px]">
            {/* User Query */}
            <div className="flex items-start justify-end gap-2">
              <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tr-xs bg-primary text-white font-medium shadow-xs">
                Find roles matching my TypeScript & Cloud backend experience and optimize my positioning.
              </div>
            </div>

            {/* Agent Answer */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-secondary-bg border border-border text-foreground space-y-1.5 shadow-xs">
                <p className="font-semibold text-foreground flex items-center justify-between">
                  <span>Target Match Analysis:</span>
                  <span className="text-primary font-bold text-[10px]">3 High-Fit Roles Found</span>
                </p>
                <p className="text-muted-foreground text-[10.5px] leading-relaxed">
                  Your resume has strong alignment with <strong className="text-foreground">Full Stack / Platform roles</strong>.
                  I’ve matched your cloud architecture skills and prepared 2 actionable bullet-point enhancements.
                </p>
              </div>
            </div>
          </div>

          {/* Connected Quick Action Pills */}
          <div className="pt-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[10.5px] font-semibold text-foreground shadow-2xs hover:border-primary/40 transition-colors">
              <Search className="w-3 h-3 text-primary" /> View 3 Matched Jobs
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[10.5px] font-semibold text-foreground shadow-2xs hover:border-primary/40 transition-colors">
              <Zap className="w-3 h-3 text-warning" /> Refine in Resume Builder
            </span>
          </div>
        </div>
      </div>

      {/* ── Top-Left Floating Badge: Resume Parsing & ATS Metric ── */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5, type: 'spring', stiffness: 120, damping: 16 }}
        className="absolute -top-6 -left-4 sm:-top-7 sm:-left-6 p-3 rounded-2xl bg-card border border-border shadow-[0_12px_32px_rgba(0,0,0,0.09)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex items-center gap-3 backdrop-blur-md"
      >
        <ScoreRingMini score={92} />
        <div className="flex flex-col">
          <span className="text-[11px] font-extrabold text-foreground">ATS Optimization</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Top 5% Keyword Match</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="px-1.5 py-0.2 rounded bg-success/10 text-success text-[9px] font-bold">
              ↑ +14 pts
            </span>
            <span className="text-[9px] text-muted-foreground">vs generic CV</span>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom-Right Floating Card: Intelligent Job Match Preview ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.0, duration: 0.55, type: 'spring', stiffness: 110, damping: 17 }}
        className="absolute -bottom-6 -right-3 sm:-bottom-7 sm:-right-5 p-3.5 rounded-2xl bg-card border border-border shadow-[0_16px_36px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.55)] flex items-center gap-3.5 max-w-[280px]"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-extrabold text-foreground truncate">
              Senior Full Stack Engineer
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-success/15 text-success text-[9px] font-black flex-shrink-0">
              96% Fit
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            Stripe · Remote (Global)
          </p>
          <div className="flex items-center gap-1 mt-1 text-[9px] text-primary font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Skills matched: React, Node, AWS</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Hero Section Main Export
   ───────────────────────────────────────────── */
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 80, damping: 18 },
    },
  }

  const panelVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 70, damping: 16, delay: 0.2 },
    },
  }

  return (
    <section
      ref={ref}
      className="relative min-h-[88vh] pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-background"
      aria-label="Hero"
    >
      {/* ── Background Ambient Canvas ────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {/* Central primary glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-primary/8 dark:bg-primary/12 rounded-full blur-[140px]" />
        {/* Subtle accent glow */}
        <div className="absolute top-1/3 right-4 w-[420px] h-[420px] bg-info/6 dark:bg-info/8 rounded-full blur-[110px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-55" />
        {/* Gradient fade to bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* ── Main Hero Layout ─────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-16">

          {/* ── LEFT: Value Proposition Column ───────── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="flex-1 max-w-2xl lg:max-w-none text-center lg:text-left"
          >
            {/* Category Pill */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                AI Job Search & Career Agent
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] xl:text-[3.65rem] tracking-tight text-foreground leading-[1.1] sm:leading-[1.12]"
            >
              AI-Powered Job Discovery &amp;{' '}
              <span className="text-primary">Personalized Career Guidance.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-secondary-foreground leading-relaxed max-w-[52ch] mx-auto lg:mx-0"
            >
              Discover relevant tech opportunities matched to your actual skills, and collaborate with a dedicated AI Career Agent to navigate your job search and optimize your resume.
            </motion.p>

            {/* CTA Button Group */}
            <motion.div
              variants={itemVariants}
              className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5"
            >
              <Link
                to="/signup"
                id="hero-cta-primary"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer w-full sm:w-auto justify-center"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#how-it-works"
                id="hero-cta-secondary"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-secondary-foreground hover:text-foreground active:scale-[0.98] font-semibold text-sm sm:text-base rounded-xl border border-border hover:border-primary/30 hover:bg-secondary-bg transition-all duration-200 cursor-pointer w-full sm:w-auto justify-center"
              >
                <ChevronDown className="w-4 h-4" />
                <span>See How It Works</span>
              </a>
            </motion.div>

            {/* Micro-Proof Footer */}
            <motion.div
              variants={itemVariants}
              className="mt-6 flex items-center justify-center lg:justify-start gap-3.5 text-xs text-muted-foreground"
            >
              <span>No credit card required</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Instant profile matching</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Free to get started</span>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Layered SaaS Product Story Visual ── */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="mt-14 lg:mt-0 flex-1 flex items-center justify-center lg:justify-end animate-float-gentle"
          >
            <HeroProductComposition />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
