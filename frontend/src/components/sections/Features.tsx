import { Video, Code2, HeartHandshake, Speech, Sparkles, LineChart } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Features() {
  const features = [
    {
      icon: Video,
      title: 'AI Mock Interviews',
      desc: 'Interact with human-like AI avatars that react to your responses and ask dynamic follow-up questions tailored to your field.',
    },
    {
      icon: Code2,
      title: 'Technical Interview Practice',
      desc: 'Test your algorithmic, system design, and coding skills in an interactive environment with instant feedback on complexity.',
    },
    {
      icon: HeartHandshake,
      title: 'HR Interview Simulation',
      desc: 'Prepare for typical human resources screening, cultural alignment checks, and salary negotiation conversations with confidence.',
    },
    {
      icon: Speech,
      title: 'Behavioral Question Training',
      desc: 'Practice STAR (Situation, Task, Action, Result) answers with guided AI coaching that helps structure your professional storytelling.',
    },
    {
      icon: Sparkles,
      title: 'Instant AI Feedback',
      desc: 'Get precise scores on speech pacing, filler word counts, sentiment tone analysis, and clear suggestions for improvement.',
    },
    {
      icon: LineChart,
      title: 'Progress Tracking Dashboard',
      desc: 'Track your preparation readiness score over time, review past interview recordings, and see your growth across different domains.',
    },
  ]

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 16 } },
  }

  return (
    <section id="features" className="py-14 sm:py-16 md:py-20 bg-secondary-bg/30 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-2">Core Capabilities</p>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight mb-3">
            Everything You Need to Succeed
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            TalentPrep provides a comprehensive suite of interview simulators and feedback modules powered by modern artificial intelligence.
          </p>
        </div>

        {/* Features Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {features.map((item, idx) => {
            const IconComponent = item.icon
            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-card rounded-2xl border border-border p-7 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col items-start text-left gap-4 group"
              >
                {/* Icon Wrapper */}
                <div className="p-3.5 rounded-xl border border-border bg-secondary-bg text-secondary-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:border-transparent group-hover:shadow-sm">
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
