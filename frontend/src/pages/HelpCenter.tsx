import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, Briefcase, Video, Wifi, ChevronDown, MessageSquare, AlertCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuthenticatedNavbar from '@/components/layout/AuthenticatedNavbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/services/authService'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    id: 'resume-parsing',
    category: 'Resume Management',
    question: 'How does resume parsing work and what file formats are supported?',
    answer: 'TalentPrep supports PDF and DOCX files up to 10MB. When you upload a resume, our parser extracts your work history, technical skills, projects, and education into structured data. Selectable text PDFs yield optimal parsing accuracy.',
  },
  {
    id: 'ats-score-meaning',
    category: 'Resume Management',
    question: 'What does my ATS Evaluation Score mean?',
    answer: 'Your overall ATS score (0-100) evaluates formatting machine-readability, keyword taxonomy coverage, section structure, and quantified impact. A score above 85 indicates strong compatibility with enterprise ATS scanners.',
  },
  {
    id: 'job-match-score',
    category: 'Job Matching',
    question: 'How is the Job Match score calculated?',
    answer: 'The matching algorithm evaluates your parsed resume taxonomy against the job description requirements, factoring in core technologies, experience depth, and domain requirements. Matched and missing skills are displayed transparently.',
  },
  {
    id: 'job-match-timing',
    category: 'Job Matching',
    question: 'Why does job matching show an indeterminate progress status?',
    answer: 'Job matching performs multi-stage contextual text analysis in the background. Processing typically completes within 3 to 8 seconds with live stage progress updates.',
  },
  {
    id: 'interview-sessions',
    category: 'AI Interview Practice',
    question: 'How do AI Interview Simulations function?',
    answer: 'Mock interview sessions simulate real technical, system design, coding, and behavioral rounds. The system asks calibrated questions, evaluates answer architecture using the STAR methodology or test suites, and provides actionable scorecards.',
  },
  {
    id: 'privacy-security',
    category: 'Privacy & Data',
    question: 'Is my resume data sold or shared with recruiters?',
    answer: 'No. TalentPrep enforces strict data security. Uploaded resumes and transcripts are encrypted in transit and at rest and are never sold to external third parties.',
  },
  {
    id: 'network-errors',
    category: 'Troubleshooting',
    question: 'What should I do if I get a Network Error or Offline Toast?',
    answer: 'If connectivity drops, TalentPrep alerts you with a status banner. Your session remains authenticated in local storage. Once reconnected, click retry on the active component.',
  },
  {
    id: 'session-expiration',
    category: 'Troubleshooting',
    question: 'Why was I logged out automatically?',
    answer: 'TalentPrep utilizes secure HttpOnly JWT tokens. When your authentication token expires, you are prompted to sign in again to safeguard account security.',
  },
]

export default function HelpCenter() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>('resume-parsing')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] dark:bg-[#080908] text-[#080908] dark:text-[#FAF8F3] transition-colors">
      {user ? <AuthenticatedNavbar /> : <Navbar />}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#080908] text-[#FAF8F3] text-xs font-mono mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
            Documentation & Support
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#080908] dark:text-[#FAF8F3] tracking-tight">
            How can we help you?
          </h1>

          <p className="text-xs sm:text-sm text-[#2C2E2B] dark:text-[#E2DFD7] mt-2 leading-relaxed">
            Search our guides for resume parsing, mock interviews, ATS score diagnostics, and platform questions.
          </p>

          {/* Search Input */}
          <div className="mt-6 relative max-w-lg mx-auto">
            <Search className="w-4 h-4 text-[#383B36] dark:text-[#BDB9AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resume analysis, mock interview rounds, ATS scores..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg text-xs sm:text-sm text-[#080908] dark:text-[#FAF8F3] placeholder:text-[#080908]/50 dark:placeholder:text-[#FAF8F3]/50 focus:outline-none focus:border-[#080908] dark:focus:border-[#CDF22B] shadow-2xs transition-colors"
            />
          </div>
        </div>

        {/* Quick Category Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg p-3.5 text-center space-y-1">
            <FileText className="w-4 h-4 text-[#080908] dark:text-[#CDF22B] mx-auto" />
            <p className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">Resume Analysis</p>
            <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF]">Parsing & ATS</p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg p-3.5 text-center space-y-1">
            <Briefcase className="w-4 h-4 text-[#080908] dark:text-[#CDF22B] mx-auto" />
            <p className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">Job Matching</p>
            <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF]">Skills & Gaps</p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg p-3.5 text-center space-y-1">
            <Video className="w-4 h-4 text-[#080908] dark:text-[#CDF22B] mx-auto" />
            <p className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">Mock Interviews</p>
            <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF]">4 Format Practice</p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg p-3.5 text-center space-y-1">
            <Wifi className="w-4 h-4 text-[#080908] dark:text-[#CDF22B] mx-auto" />
            <p className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">Connectivity</p>
            <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF]">Gateway & Status</p>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div
                  key={faq.id}
                  className="bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#080908] dark:text-[#FAF8F3] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#1A1C18] text-[#383B36] dark:text-[#BDB9AF] text-[10px] font-mono uppercase">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#383B36] dark:text-[#BDB9AF] transition-transform duration-150 flex-shrink-0 ${isOpen ? 'rotate-180 text-[#080908] dark:text-[#CDF22B]' : ''
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="px-4 pb-4 pt-1 text-xs text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed border-t border-[#E5E0D5] dark:border-[#232621]">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg space-y-1.5">
              <AlertCircle className="w-6 h-6 text-[#383B36] dark:text-[#BDB9AF] mx-auto" />
              <p className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">No questions found</p>
              <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF]">Try searching for "ATS", "interview", or "parsing".</p>
            </div>
          )}
        </div>

        {/* Contact Support Banner */}
        <div id="contact" className="mt-14 bg-[#080908] text-[#FAF8F3] border border-[#232621] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <h2 className="font-heading font-bold text-base text-[#FAF8F3]">Have a specific inquiry?</h2>
            <p className="text-xs text-[#D8D5CB] mt-1 max-w-md leading-relaxed">
              Our engineering team is available for API questions, mock interview configuration, or feedback.
            </p>
          </div>

          <a
            href="mailto:support@talentprep.ai"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CDF22B] text-[#080908] hover:bg-[#BCE01E] font-bold text-xs rounded-lg transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contact support</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
