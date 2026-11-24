import { ShieldCheck, Cpu, Search, Layers, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Trust() {
  const pillars = [
    {
      id: 1,
      title: 'Contextual Resume Intelligence',
      badge: 'Parsing Engine',
      desc: 'Deep multi-section extraction that breaks down complex resumes into structured skills, timelines, and impact metrics.',
      icon: Cpu,
    },
    {
      id: 2,
      title: 'Real-Time Job Compatibility',
      badge: 'Live Discovery',
      desc: 'Matches live job openings against your actual validated skill set with transparent alignment indicators.',
      icon: Search,
    },
    {
      id: 3,
      title: 'Context-Aware AI Assistant',
      badge: 'Career Agent',
      desc: 'Interacts with your unique background to provide actionable suggestions, career gap analysis, and tailored positioning.',
      icon: Layers,
    },
    {
      id: 4,
      title: 'Privacy & Data Security First',
      badge: 'Encrypted & Safe',
      desc: 'Your career documents are encrypted. We never sell, rent, or distribute your personal career profile.',
      icon: ShieldCheck,
    },
  ]

  return (
    <section className="py-16 sm:py-20 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Built for Serious Professionals
          </p>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight">
            Engineered for Career Precision & Privacy
          </h2>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-secondary-bg/40 p-6 rounded-2xl border border-border flex flex-col justify-between hover:border-primary/25 hover:bg-card transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
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
