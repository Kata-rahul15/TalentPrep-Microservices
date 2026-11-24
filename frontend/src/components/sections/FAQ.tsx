import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'What is TalentPrep?',
      answer:
        'TalentPrep is a minimal, focused career platform that combines resume analysis, targeted job discovery, and AI-powered mock interview practice to prepare you for your next technical role.',
    },
    {
      question: 'How does resume analysis work?',
      answer:
        'Upload your resume in PDF or DOCX format. TalentPrep parses your work experience, evaluates your formatting and content against ATS benchmarks, identifies skill gaps, and suggests high-impact improvements.',
    },
    {
      question: 'What types of interviews can I practice?',
      answer:
        'You can simulate four core interview formats: Technical Architecture, Live Coding with an in-browser code runner, System Design, and Behavioral HR rounds using the STAR method.',
    },
    {
      question: 'How does TalentPrep find matching jobs?',
      answer:
        'TalentPrep compares your verified skills and experience against live market job postings, ranking roles by skill overlap and showing you transparent compatibility scores upfront.',
    },
    {
      question: 'Is TalentPrep free to use?',
      answer:
        'Yes. You can create a free account to upload your resume, receive an ATS evaluation, browse matching jobs, and complete practice mock interview sessions.',
    },
  ]

  const toggleAccordion = (idx: number) => {
    setActiveIndex(activeIndex === idx ? null : idx)
  }

  return (
    <section
      id="faq"
      className="py-20 md:py-28 bg-[#FFFFFF] dark:bg-[#080908] border-t border-[#E5E0D5] dark:border-[#232621] scroll-mt-20"
      aria-label="Frequently Asked Questions"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#080908] dark:text-[#FAF8F3] tracking-tight leading-[1.12]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
            Everything you need to know about preparing with TalentPrep.
          </p>
        </div>

        {/* Accordions List */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isActive = activeIndex === idx
            return (
              <div
                key={idx}
                className="bg-[#FAF8F3] dark:bg-[#121311] rounded-xl border border-[#080908]/12 dark:border-[#232621] transition-all overflow-hidden"
              >
                {/* Header Button */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-heading font-bold text-sm sm:text-base text-[#080908] dark:text-[#FAF8F3] focus:outline-none cursor-pointer"
                  aria-expanded={isActive}
                >
                  <span>{faq.question}</span>
                  <div className="w-6 h-6 rounded-md bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] flex items-center justify-center flex-shrink-0 text-[#080908] dark:text-[#FAF8F3]">
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
                      transition={{ duration: 0.18 }}
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed border-t border-[#E5E0D5] dark:border-[#232621] pt-3">
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
