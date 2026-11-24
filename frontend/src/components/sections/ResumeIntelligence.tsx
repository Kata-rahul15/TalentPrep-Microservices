import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  FileText,
  Sparkles,
  Layers,
  ArrowDown,
  Cpu,
  Database,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'

export default function ResumeIntelligence() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const transformationSteps = [
    {
      title: 'Raw Document Ingestion',
      desc: 'Parses PDF and DOCX files while preserving section structures and chronological timeline fidelity.',
      icon: FileText,
      badge: 'Input',
    },
    {
      title: 'Contextual Information Extraction',
      desc: 'Isolates core technical skills, leadership competencies, career progression, and quantified business metrics.',
      icon: Cpu,
      badge: 'Analysis',
    },
    {
      title: 'ATS & Quality Evaluation',
      desc: 'Scores your resume against modern screening criteria, spotting formatting blockers and keyword gaps.',
      icon: BarChart3,
      badge: 'Scoring',
    },
    {
      title: 'Platform-Wide Intelligence',
      desc: 'Your structured profile automatically informs your job search recommendations and AI Career Agent discussions.',
      icon: Database,
      badge: 'Ecosystem',
    },
  ]

  return (
    <section id="resume-intelligence" className="py-20 md:py-28 bg-background relative overflow-hidden scroll-mt-20">
      {/* Background Subtle Highlights */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-info/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            Resume Intelligence
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight mb-4">
            Your Resume is More Than a PDF.
          </h2>
          <p className="text-secondary-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            TalentPrep decodes the raw text of your resume into actionable career context that powers your entire journey.
          </p>
        </div>

        {/* ── Visual Transformation Composition ── */}
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ── LEFT: The Visual Document-to-Intelligence Architecture ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col gap-3"
          >
            {/* Top Node: Document Upload */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Candidate_Resume.pdf</h4>
                  <p className="text-xs text-muted-foreground">Standard 2-page curriculum vitae</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold">
                Parsed
              </span>
            </div>

            {/* Connecting Bridge */}
            <div className="flex justify-center py-1 text-primary">
              <ArrowDown className="w-5 h-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
            </div>

            {/* Middle Node: AI Extraction Engine */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/5 via-info/5 to-primary/5 border border-primary/20 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  Context Extraction Engine
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">4 Deep Models</span>
              </div>

              {/* Grid of extracted taxonomies */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-card border border-border">
                  <span className="text-muted-foreground block text-[10px]">Skills Discovered</span>
                  <strong className="text-foreground font-bold">24 Validated</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border">
                  <span className="text-muted-foreground block text-[10px]">Experience Level</span>
                  <strong className="text-foreground font-bold">Senior (5+ Yrs)</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground block text-[10px]">ATS Readiness</span>
                  <strong className="text-success font-bold">92 / 100</strong>
                </div>
              </div>
            </div>

            {/* Connecting Bridge */}
            <div className="flex justify-center py-1 text-primary">
              <ArrowDown className="w-5 h-5 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }} />
            </div>

            {/* Bottom Node: Career Intelligence Output */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Synchronized Platform Context
                </span>
                <span className="text-[10px] font-bold text-success flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active Everywhere
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your extracted capabilities power direct job discovery and give the AI Career Agent complete insight into your career story.
              </p>
            </div>
          </motion.div>

          {/* ── RIGHT: Editorial Feature Breakdown ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="space-y-4">
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground tracking-tight leading-snug">
                From Unstructured Text to Structured Career Advantage
              </h3>
              <p className="text-sm sm:text-base text-secondary-foreground leading-relaxed">
                Most job tools treat your resume as a dumb file attachment. TalentPrep builds an interconnected knowledge model of your qualifications, achievements, and aspirations.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {transformationSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-secondary-bg/50 border border-border/80 hover:border-primary/25 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-card border border-border text-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-foreground">
                          {step.title}
                        </h4>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
