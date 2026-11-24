import { Link } from 'react-router-dom'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      if (window.location.pathname !== '/') {
        window.location.href = `/${href}`
        return
      }
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="bg-[#FAF8F3] dark:bg-[#080908] border-t border-[#E5E0D5] dark:border-[#232621] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 lg:gap-14">
          {/* Brand Column */}
          <div className="max-w-sm space-y-3">
            <Link to="/" className="inline-block">
              <TalentPrepLogo size="md" />
            </Link>
            <p className="text-xs sm:text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
              A minimal, premium career platform for technical professionals. Analyze your resume, discover matching jobs, and prepare for interviews.
            </p>
          </div>

          {/* Links Groups */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            {/* Core Features */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#080908] dark:text-[#FAF8F3]">
                Platform
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="#home"
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault()
                        handleLinkClick('#home')
                      }
                    }}
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#resume-analysis"
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault()
                        handleLinkClick('#resume-analysis')
                      }
                    }}
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    Resume Analysis
                  </a>
                </li>
                <li>
                  <a
                    href="#interview-prep"
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault()
                        handleLinkClick('#interview-prep')
                      }
                    }}
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    Interview Prep
                  </a>
                </li>
                <li>
                  <a
                    href="#job-matches"
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault()
                        handleLinkClick('#job-matches')
                      }
                    }}
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    Job Matches
                  </a>
                </li>
              </ul>
            </div>

            {/* Workflow & Help */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#080908] dark:text-[#FAF8F3]">
                Resources
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault()
                        handleLinkClick('#how-it-works')
                      }
                    }}
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault()
                        handleLinkClick('#faq')
                      }
                    }}
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <Link
                    to="/help"
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#080908] dark:text-[#FAF8F3]">
                Legal
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-and-conditions"
                    className="text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#E5E0D5] dark:border-[#232621] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#383B36] dark:text-[#BDB9AF]">
          <p>
            &copy; {currentYear} TalentPrep. All rights reserved.
          </p>
          <p className="text-[11px] font-mono">
            Crafted for technical career leverage
          </p>
        </div>
      </div>
    </footer>
  )
}
