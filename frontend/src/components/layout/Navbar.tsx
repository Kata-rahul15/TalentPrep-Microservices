import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/services/authService'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Resume Analysis', href: '#resume-analysis' },
    { name: 'Interview Prep', href: '#interview-prep' },
    { name: 'Job Matches', href: '#job-matches' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'FAQ', href: '#faq' },
  ]

  const handleLinkClick = (href: string) => {
    setIsOpen(false)
    if (href === '#home') {
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    if (window.location.pathname !== '/') {
      window.location.href = `/${href}`
      return
    }
    const targetElement = document.querySelector(href)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-[#FAF8F3]/95 dark:bg-[#080908]/95 backdrop-blur-md border-b border-[#E5E0D5] dark:border-[#232621] py-2.5'
          : 'bg-[#FAF8F3]/80 dark:bg-[#080908]/80 backdrop-blur-xs py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          {/* Left: TalentPrep Logo */}
          <div
            className="flex-shrink-0 flex items-center cursor-pointer"
            onClick={() => handleLinkClick('#home')}
          >
            <TalentPrepLogo size="md" />
          </div>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    e.preventDefault()
                    handleLinkClick(link.href)
                  }
                }}
                className="text-xs font-semibold text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors py-1"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right: Auth / Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/home"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] hover:border-[#080908] dark:hover:border-[#CDF22B] transition-colors"
                >
                  <div className="w-5 h-5 rounded bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-[10px] uppercase">
                    {user.username?.slice(0, 2) || 'TP'}
                  </div>
                  <span className="text-xs font-semibold text-[#080908] dark:text-[#FAF8F3] leading-tight">
                    {user.username}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-xs font-semibold text-[#383B36] hover:text-[#DC2626] dark:text-[#BDB9AF] dark:hover:text-[#DC2626] transition-colors px-2 py-1.5 cursor-pointer"
                >
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3] transition-colors px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#BCE01E] active:scale-[0.98] transition-all px-4 py-2 rounded-lg shadow-2xs"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-[#080908] dark:text-[#FAF8F3] hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C18] transition-colors cursor-pointer"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden fixed inset-0 top-[52px] bg-[#080908]/40 backdrop-blur-xs z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden relative z-50 border-b border-[#E5E0D5] bg-[#FAF8F3] dark:bg-[#080908] shadow-md dark:border-[#232621]"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault()
                      }
                      handleLinkClick(link.href)
                    }}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#080908] dark:text-[#FAF8F3] hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C18] transition-colors cursor-pointer"
                  >
                    {link.name}
                  </a>
                ))}

                <div className="pt-3 border-t border-[#E5E0D5] dark:border-[#232621]">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/home"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621]"
                      >
                        <div className="w-6 h-6 rounded bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-xs uppercase">
                          {user.username?.slice(0, 2) || 'TP'}
                        </div>
                        <span className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                          {user.username}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-xs font-semibold text-[#DC2626] py-2 rounded-lg border border-[#DC2626]/20 bg-[#DC2626]/5 text-center cursor-pointer"
                      >
                        {isLoggingOut ? 'Logging out...' : 'Log out'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3] py-2.5 rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] text-center"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-bold text-[#080908] py-2.5 rounded-lg bg-[#CDF22B] hover:bg-[#BCE01E] text-center shadow-2xs"
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
