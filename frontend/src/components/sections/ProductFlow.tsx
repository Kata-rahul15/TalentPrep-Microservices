import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  UploadCloud,
  Cpu,
  Search,
  Bot,
  FileCheck,
  Rocket,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export default function ProductFlow() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const flowSteps = [
    {
      step: '01',
      title: 'Upload Your Resume',
      desc: 'Drop your current PDF or DOCX file to instantly initiate deep contextual extraction.',
      icon: UploadCloud,
      pill: 'Input',
    },
    {
      step: '02',
      title: 'TalentPrep Understands Your Profile',
      desc: 'Our engine identifies your technical taxonomy, seniority, and key achievements.',
      icon: Cpu,
      pill: 'Intelligence',
    },
    {
      step: '03',
      title: 'Discover Tailored Opportunities',
      desc: 'AI Job Search calculates compatibility scores against live openings in your domain.',
      icon: Search,
      pill: 'Discovery',
    },
    {
      step: '04',
      title: 'Collaborate with Your Career Agent',
      desc: 'Ask strategic questions, explore career transitions, and get actionable suggestions.',
      icon: Bot,
      pill: 'Guidance',
    },
    {
      step: '05',
      title: 'Build & Refine Your Documents',
      desc: 'Use the Resume Studio to generate crisp, ATS-compliant versions tailored for target jobs.',
      icon: FileCheck,
      pill: 'Creation',
    },
    {
      step: '06',
      title: 'Take the Confident Next Step',
      desc: 'Apply with clarity, knowing your resume, skills, and positioning are fully aligned.',
      icon: Rocket,
      pill: 'Success',
    },
  ]

  return (
    <section id="product-flow" className="py-20 md:py-28 bg-background relative overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            End-to-End Experience
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight mb-4">
            The Complete TalentPrep Workflow
          </h2>
          <p className="text-secondary-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            From raw document to career momentum in six connected milestones.
          </p>
        </div>

        {/* Connected Visual Timeline / Path */}
        <div ref={ref} className="relative">
          {/* Subtle horizontal connecting rail for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -translate-y-8 pointer-events-none" />

          {/* 6-step Asymmetric Grid Composition */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {flowSteps.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative bg-card rounded-3xl border border-border p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Icon & Step Number */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary-bg text-[10px] font-bold text-muted-foreground uppercase tracking-wider border border-border">
                          {item.pill}
                        </span>
                        <span className="font-heading font-black text-lg text-foreground/30">
                          {item.step}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-divider flex items-center justify-between text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA Hook */}
        <div className="mt-14 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-primary hover:text-primary-hover transition-colors"
          >
            <span>Start your workflow with a free resume scan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}
