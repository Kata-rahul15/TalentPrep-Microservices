import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, HelpCircle, FileText, Briefcase, Video, Wifi, ChevronDown, MessageSquare, AlertCircle } from 'lucide-react'
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
    answer: 'TalentPrep supports PDF and DOCX files up to 10MB. When you upload a resume, our parser extracts your work history, technical skills, projects, and education into structured JSON data. Ensure your PDF has selectable text for optimal extraction accuracy.',
  },
  {
    id: 'ats-score-meaning',
    category: 'Resume Management',
    question: 'What does my ATS Evaluation Score mean?',
    answer: 'Your overall ATS score (0-100) measures formatting readability, keyword density, section organization, and measurable achievements. A score above 80 indicates high compatibility with enterprise applicant tracking systems.',
  },
  {
    id: 'job-match-score',
    category: 'Job Matching',
    question: 'How is the Job Match score calculated?',
    answer: 'The job match algorithm analyzes your parsed resume against the submitted job description, evaluating skill overlap, required technologies, experience level, and domain keywords. Matched and missing skills are highlighted with recommendations.',
  },
  {
    id: 'job-match-timing',
    category: 'Job Matching',
    question: 'Why does job matching show an indeterminate progress status?',
    answer: 'Job matching performs multi-stage AI text analysis in the background. Depending on job description complexity, processing takes between 3 to 10 seconds. Live stage indicators update as each step completes.',
  },
  {
    id: 'interview-sessions',
    category: 'AI Interview Practice',
    question: 'How do AI Interview Simulations function?',
    answer: 'Interview practice sessions generate roleplay questions tailored to your target job domain. The AI evaluates technical accuracy, answer structure (STAR method), and communication clarity, giving instant feedback.',
  },
  {
    id: 'privacy-security',
    category: 'Privacy & Data',
    question: 'Is my resume data sold or shared with recruiters?',
    answer: 'No. TalentPrep strictly protects your candidate privacy. Uploaded resumes and AI chat histories are stored securely and never sold to third-party ad networks or recruiters without your explicit permission.',
  },
  {
    id: 'network-errors',
    category: 'Troubleshooting',
    question: 'What should I do if I get a Network Error or Offline Toast?',
    answer: 'If your internet disconnects, TalentPrep notifies you with an offline toast notification. Your session remains logged in locally. Reconnect to the internet and click "Try Again" on any failed page components.',
  },
  {
    id: 'session-expiration',
    category: 'Troubleshooting',
    question: 'Why was I logged out automatically?',
    answer: 'TalentPrep uses HttpOnly JWT access tokens. If your refresh token expires or is invalidated, you will be redirected to the login screen for session security. Refreshing your page re-authenticates automatically if your session is active.',
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
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {user ? <AuthenticatedNavbar /> : <Navbar />}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>Support & Documentation</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight">
            How can we help you?
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
            Search our knowledge base for guidance on resume uploads, job matching, AI scoring, and system error resolution.
          </p>

          {/* Search Input */}
          <div className="mt-8 relative max-w-xl mx-auto">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resume parsing, job match scores, network errors..."
              className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
            />
          </div>
        </motion.div>

        {/* Quick Category Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-1 shadow-xs">
            <FileText className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xs font-bold text-foreground">Resume Analysis</p>
            <p className="text-[11px] text-muted-foreground">Parsing & ATS</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-1 shadow-xs">
            <Briefcase className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xs font-bold text-foreground">Job Matching</p>
            <p className="text-[11px] text-muted-foreground">Skills & Gaps</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-1 shadow-xs">
            <Video className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xs font-bold text-foreground">AI Practice</p>
            <p className="text-[11px] text-muted-foreground">Simulations</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-1 shadow-xs">
            <Wifi className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xs font-bold text-foreground">Connectivity</p>
            <p className="text-[11px] text-muted-foreground">Error fixes</p>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div
                  key={faq.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-bg text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-secondary-foreground leading-relaxed border-t border-border/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-2">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No questions found matching your search.</p>
              <p className="text-xs text-muted-foreground">Try searching for keywords like "ATS", "parsing", or "network".</p>
            </div>
          )}
        </div>

        {/* Contact Support Banner */}
        <div id="contact" className="mt-16 bg-slate-950 text-white rounded-3xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-bold text-lg">Still have questions?</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Our support engineering team is available to assist with resume parsing issues, API questions, or feedback.
            </p>
          </div>

          <a
            href="mailto:support@talentprep.ai"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all shadow-sm flex-shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
