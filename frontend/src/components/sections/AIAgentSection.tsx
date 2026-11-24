import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Sparkles,
  Send,
  FileText,
  Target,
  Compass,
  Zap,
} from 'lucide-react'

export default function AIAgentSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const promptSuggestions = [
    'Analyze my skill gaps for a Principal Engineer role',
    'How do I frame my transition to Cloud Platforms?',
    'Review my impact metrics for Stripe Senior Developer application',
  ]

  return (
    <section id="ai-agent" className="py-20 md:py-28 bg-background relative overflow-hidden scroll-mt-20">
      {/* Background Lighting Elements */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-18">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Bot className="w-3.5 h-3.5" />
            AI Career Agent
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight mb-4">
            An AI Assistant That Truly Understands Your Career Context.
          </h2>
          <p className="text-secondary-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Unlike generic chatbots, TalentPrep’s Career Agent has direct visibility into your parsed resume, skill matrix, and job search objectives.
          </p>
        </div>

        {/* ── Immersive AI Workspace Showcase ── */}
        <div ref={ref} className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-border bg-card shadow-[0_24px_70px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Workspace Top Toolbar */}
            <div className="px-5 py-3.5 border-b border-border bg-secondary-bg/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                    TalentPrep Career Agent
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Contextual Career Advisor</p>
                </div>
              </div>

              {/* Active Context Chip */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-card border border-border text-xs shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground text-[11px]">Resume: rahul_fullstack_2026.pdf</span>
                <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.2 rounded">Loaded</span>
              </div>
            </div>

            {/* Workspace Chat Area */}
            <div className="p-5 sm:p-7 space-y-5 bg-gradient-to-b from-background via-card to-card">
              
              {/* User Question */}
              <div className="flex items-start justify-end gap-3">
                <div className="max-w-2xl px-4 py-3 rounded-2xl rounded-tr-xs bg-primary text-white text-xs sm:text-sm font-medium shadow-xs leading-relaxed">
                  How should I position my current experience at Infosys when applying for a Senior Staff Architect role at high-growth startups?
                </div>
              </div>

              {/* Agent Rich Response */}
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>

                <div className="flex-1 p-5 rounded-2xl rounded-tl-xs bg-secondary-bg/70 border border-border text-foreground space-y-3 shadow-xs text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold text-foreground text-sm flex items-center gap-2">
                      Strategic Positioning Strategy
                    </span>
                    <span className="text-[10.5px] font-bold text-primary">Based on your 6 yrs experience</span>
                  </div>

                  <p className="text-secondary-foreground leading-relaxed">
                    Looking at your parsed resume, you already have strong foundation in <strong className="text-foreground">microservices architecture and high-throughput data pipelines</strong>. Here is how to sharpen your narrative:
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="p-3 rounded-xl bg-card border border-border flex items-start gap-2.5">
                      <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block font-bold text-xs">1. Quantify Architecture Scale</strong>
                        <span className="text-muted-foreground text-xs leading-relaxed">
                          Replace "designed microservices" with "Architected 12+ asynchronous event-driven services processing 45M daily transactions at 99.98% uptime."
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block font-bold text-xs">2. Spotlight Cross-Team Technical Leadership</strong>
                        <span className="text-muted-foreground text-xs leading-relaxed">
                          Your profile notes mentoring junior developers. Emphasize leading RFC design reviews and driving company-wide TypeScript adoption.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connected Next Actions */}
                  <div className="pt-2 border-t border-divider flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      💡 Would you like me to update these bullet points in your Resume Builder?
                    </span>
                    <Link
                      to="/signup"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-2xs hover:bg-primary-hover transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      Open in Resume Builder
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Interactive Prompt Suggestions */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Suggested Contextual Queries:
                </span>
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-secondary-bg border border-border hover:border-primary/40 text-[11.5px] font-medium text-foreground transition-all flex items-center gap-1.5 cursor-default"
                    >
                      <Sparkles className="w-3 h-3 text-primary" />
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Input Bar Mockup */}
            <div className="p-4 border-t border-border bg-secondary-bg/50 flex items-center gap-3">
              <div className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-xs text-muted-foreground flex items-center justify-between">
                <span>Ask your Career Agent about your resume, jobs, or next steps...</span>
                <span className="text-[10px] font-mono bg-secondary-bg px-1.5 py-0.5 rounded border border-border">Ctrl + Enter</span>
              </div>
              <button
                disabled
                className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs opacity-90"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  )
}
