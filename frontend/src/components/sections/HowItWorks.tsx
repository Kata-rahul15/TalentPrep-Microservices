import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  FileText,
  Search,
  Bot,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Target,
  FileSpreadsheet,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const steps = [
    {
      step: '01',
      phase: 'RESUME CONTEXT',
      title: 'Upload or Provide Resume Information',
      tagline: 'Start by providing your resume in PDF or DOCX format.',
      description:
        'TalentPrep securely extracts your skills, work history, and achievements into structured career context that powers your personalized experience.',
      icon: FileText,
      badge: 'Step 1: Provide Resume',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      actionText: 'Get Started',
      actionHref: '/signup',
      // UI Demonstration Snippet
      preview: (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Extracted Profile Context</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
              Profile Ready
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-[11px]">
              <span className="font-semibold text-muted-foreground">Identified Skills Taxonomy:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['TypeScript', 'React.js', 'Node.js', 'System Architecture', 'PostgreSQL', 'AWS'].map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-secondary-bg border border-border text-[10px] font-medium text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2 text-[11px] text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-primary font-bold">Context Synced:</strong> Career history is loaded for immediate job matching and agent consultation.
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: '02',
      phase: 'DISCOVER',
      title: 'Discover Relevant Jobs',
      tagline: 'Explore opportunities matched to your actual capabilities.',
      description:
        'Search tech roles ranked by skill alignment. Filter by remote, hybrid, or on-site work models and review transparent compatibility metrics.',
      icon: Search,
      badge: 'Step 2: Find Jobs',
      badgeColor: 'bg-info/10 text-info border-info/20',
      actionText: 'Explore Job Search',
      actionHref: '/signup',
      // UI Demonstration Snippet
      preview: (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-info" />
              <span className="text-xs font-bold text-foreground">Role Compatibility Feed</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">Live Tech Roles</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-secondary-bg border border-border flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-foreground">Lead Frontend Architect</h4>
                <p className="text-[10px] text-muted-foreground">Vercel · Remote · Full-time</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-md bg-success/15 text-success text-[10px] font-black">
                  95% Match
                </span>
                <p className="text-[9px] text-muted-foreground mt-0.5">Top Skill Fit</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary-bg/60 border border-border flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-foreground">Senior Platform Engineer</h4>
                <p className="text-[10px] text-muted-foreground">Cloudflare · Hybrid</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                  88% Match
                </span>
                <p className="text-[9px] text-muted-foreground mt-0.5">Strong Alignment</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: '03',
      phase: 'GUIDANCE',
      title: 'Work with the AI Career Agent',
      tagline: 'Get personalized career guidance and application assistance.',
      description:
        'Collaborate with your dedicated AI assistant to evaluate target positions, improve resume bullet points, and get actionable recommendations.',
      icon: Bot,
      badge: 'Step 3: AI Career Agent',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      actionText: 'Meet Your Agent',
      actionHref: '/signup',
      // UI Demonstration Snippet
      preview: (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">AI Career Agent Session</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
              <Sparkles className="w-3 h-3" />
              Context Active
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="p-3 rounded-xl bg-secondary-bg border border-border space-y-1">
              <span className="font-bold text-foreground block">Career Agent Guidance:</span>
              <p className="text-muted-foreground text-[10.5px] leading-relaxed">
                "For the Lead Architect position, highlight your distributed state management experience and quantify the 40% performance gain from your recent project."
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold text-primary">
              <TrendingUp className="w-3 h-3" />
              <span>Tailored resume recommendations ready</span>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-secondary-bg/40 border-y border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            The Product Journey
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight mb-4">
            How TalentPrep Works
          </h2>
          <p className="text-secondary-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            A cohesive three-stage cycle designed to turn static career data into measurable momentum.
          </p>
        </div>

        {/* ── Continuous Editorial Timeline Layout ── */}
        <div ref={ref} className="space-y-12 md:space-y-16">
          {steps.map((item, idx) => {
            const isEven = idx % 2 === 1
            const Icon = item.icon

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${
                  isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-8 lg:gap-14 bg-card/80 backdrop-blur-xs border border-border p-6 sm:p-8 lg:p-10 rounded-3xl shadow-xs hover:border-primary/25 transition-all duration-300`}
              >
                {/* ── Text Editorial Column ── */}
                <div className="flex-1 text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-black text-2xl sm:text-3xl text-primary/40">
                      {item.step}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wide border ${item.badgeColor}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {item.phase}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-foreground tracking-tight leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-sm sm:text-base font-medium text-foreground/90 leading-relaxed">
                    {item.tagline}
                  </p>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={item.actionHref}
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors group cursor-pointer"
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* ── Interactive UI Preview Column ── */}
                <div className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0">
                  {item.preview}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
