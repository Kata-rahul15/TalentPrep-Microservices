import { useState } from 'react'
import { Plus, Minus, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'What is TalentPrep?',
      answer:
        'TalentPrep is an AI-powered career platform focused on intelligent job discovery and personalized guidance. It helps you discover relevant job opportunities matched to your actual skills and collaborate with a dedicated AI Career Agent for career and resume advice.',
    },
    {
      question: 'How does AI Job Search work?',
      answer:
        'AI Job Search matches tech openings against your experience and capabilities. Instead of relying solely on basic keywords, it calculates skill compatibility scores and lets you filter by role, location, and work model (Remote, Hybrid, On-site).',
    },
    {
      question: 'What is the AI Career Agent?',
      answer:
        'The AI Career Agent is your dedicated career assistant. It has visibility into your uploaded resume context to help you analyze role requirements, suggest bullet point enhancements, evaluate skill gaps, and navigate your job search effectively.',
    },
    {
      question: 'How does TalentPrep use my resume information?',
      answer:
        'When you upload your resume (PDF or DOCX), TalentPrep extracts your skills, work history, and achievements into structured context. This context is used to personalize your job match scores and empower your AI Career Agent conversations.',
    },
    {
      question: 'Does TalentPrep automatically apply for jobs on my behalf?',
      answer:
        'No. TalentPrep does not submit automated applications or message recruiters autonomously. It provides you with match scores, skill insights, and direct links so you can make informed application decisions.',
    },
    {
      question: 'Is my resume data and personal information secure?',
      answer:
        'Yes. We take privacy and security seriously. Your resumes, profile details, and agent conversations are securely stored and encrypted. We do not sell or distribute your private career data to third parties.',
    },
    {
      question: 'How do I get started with TalentPrep?',
      answer:
        'You can create a free account in seconds, provide your resume or background information, explore matched job opportunities, and start collaborating with your AI Career Agent right away.',
    },
  ]

  const toggleAccordion = (idx: number) => {
    setActiveIndex(activeIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="py-20 md:py-28 bg-secondary-bg/30 border-t border-border scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Answers to Common Questions
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-secondary-foreground text-base sm:text-lg leading-relaxed">
            Everything you need to know about TalentPrep’s features, career intelligence, and privacy.
          </p>
        </div>

        {/* Accordions List */}
        <div className="flex flex-col gap-3.5">
          {faqs.map((faq, idx) => {
            const isActive = activeIndex === idx
            return (
              <div
                key={idx}
                className={`bg-card rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'border-primary/50 shadow-xs ring-1 ring-primary/10'
                    : 'border-border shadow-2xs hover:border-border/80'
                }`}
              >
                {/* Header Button */}
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full px-5 sm:px-6 py-4.5 flex items-center justify-between gap-4 text-left font-heading font-bold text-sm sm:text-base text-foreground focus:outline-none cursor-pointer"
                  aria-expanded={isActive}
                >
                  <span>{faq.question}</span>
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive
                        ? 'bg-primary text-white border-primary'
                        : 'bg-secondary-bg border-border text-muted-foreground'
                    }`}
                  >
                    {isActive ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Body Content */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-5 sm:px-6 pb-5 text-sm sm:text-[14.5px] text-secondary-foreground leading-relaxed border-t border-divider pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
