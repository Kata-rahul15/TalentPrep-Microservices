import { Heart, Target, Clock, ShieldCheck, HelpCircle, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Benefits() {
  const benefitsList = [
    {
      title: 'Improve Confidence',
      desc: 'Build psychological safety through mock practice. Reduce performance anxiety, remove verbal fillers, and perfect your initial pitch.',
      icon: Heart,
      color: 'bg-success/5 text-success border-success/20',
    },
    {
      title: 'Identify Weaknesses',
      desc: 'Get precise analytics pointing out exactly where you fell short—whether it was code complexity, structured STAR patterns, or vocal pacing.',
      icon: Target,
      color: 'bg-warning/5 text-warning border-warning/20',
    },
    {
      title: 'Practice Anytime',
      desc: 'No more waiting on human peer schedulers. Fire up simulated interview modules 24/7 on your own terms and calendar.',
      icon: Clock,
      color: 'bg-primary/5 text-primary border-primary/20',
    },
    {
      title: 'Track Progress',
      desc: 'Watch your progress bar grow and see prep score increases as you record responses across different companies and roles.',
      icon: UserCheck,
      color: 'bg-warning/5 text-warning border-warning/20',
    },
    {
      title: 'Learn from Feedback',
      desc: 'Stop guessing why you failed. Read concrete paragraph rewrites for how to frame your stories and technical explanations optimally.',
      icon: ShieldCheck,
      color: 'bg-danger/5 text-danger border-danger/20',
    },
    {
      title: 'Interview-Ready Prep',
      desc: 'Walk into FAANG or modern startup interviews knowing you have practiced the hardest behavioral and technical questions already.',
      icon: HelpCircle,
      color: 'bg-primary/5 text-primary border-primary/20',
    },
  ]

  return (
    <section id="benefits" className="py-14 sm:py-16 md:py-20 bg-secondary-bg/30 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Value Proposition</p>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight mb-3">
            Why Prepare with TalentPrep?
          </h2>
          <p className="text-secondary-foreground text-sm sm:text-base leading-relaxed">
            Standard prep sites give you list of questions. We give you an interactive training gym to build muscle memory.
          </p>
        </div>

        {/* Benefits Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefitsList.map((benefit, idx) => {
            const Icon = benefit.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-card rounded-3xl border border-border p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex gap-4 sm:gap-5 items-start text-left hover:border-primary/20"
              >
                {/* Icon Wrapper */}
                <div className={`p-3 rounded-2xl border flex items-center justify-center flex-shrink-0 ${benefit.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                {/* Content */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
