import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/services/authService'

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
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Job Search', href: '#job-search' },
    { name: 'AI Agent', href: '#ai-agent' },
    { name: 'FAQ', href: '#faq' },
  ]

  const handleLinkClick = (href: string) => {
    setIsOpen(false)
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
      // handled in authService
      setIsLoggingOut(false)
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-800/60 shadow-xs py-2.5'
          : 'bg-transparent py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-9 sm:h-10">
          {/* Logo */}
          <div
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              if (window.location.pathname !== '/') {
                window.location.href = '/'
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">
              TalentPrep
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
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
                className="relative font-medium text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 py-1 group"
              >
                {link.name}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] rounded-full bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/home"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary-bg hover:bg-secondary-bg/80 border border-border transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] uppercase">
                    {user.username?.slice(0, 2) || 'US'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-foreground leading-tight">{user.username}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{user.email}</span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="font-medium text-sm text-gray-500 hover:text-danger disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    'Logout'
                  )}
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-medium text-sm text-gray-500 hover:text-gray-900 transition-colors px-3.5 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="font-semibold text-sm text-gray-700 hover:text-gray-950 transition-colors px-3.5 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing mobile menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 top-[52px] bg-black/30 backdrop-blur-xs z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden relative z-50 border-b border-border bg-white dark:bg-slate-900 shadow-xl max-h-[calc(100dvh-3.5rem)] overflow-y-auto"
            >
              <div className="px-4 pt-3 pb-6 space-y-1">
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
                    className="block px-3.5 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-secondary-bg transition-colors cursor-pointer"
                  >
                    {link.name}
                  </a>
                ))}

                {user ? (
                  <div className="pt-4 border-t border-border flex flex-col gap-2 px-1">
                    <Link
                      to="/home"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary-bg border border-border"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {user.username?.slice(0, 2) || 'US'}
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-xs font-bold text-foreground leading-tight truncate">{user.username}</span>
                        <span className="text-[10px] font-medium text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                      }}
                      disabled={isLoggingOut}
                      className="w-full font-semibold text-danger disabled:text-muted-foreground disabled:bg-secondary-bg disabled:border-border disabled:cursor-not-allowed py-2.5 rounded-xl border border-danger/20 bg-danger/5 text-center hover:bg-danger/10 transition-colors text-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      {isLoggingOut ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        'Logout'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-border grid grid-cols-2 gap-3 px-1">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="font-semibold text-gray-700 dark:text-gray-200 py-3 rounded-xl border border-border bg-card text-center hover:bg-secondary-bg transition-colors text-sm"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="font-semibold text-white py-3 rounded-xl bg-primary hover:bg-primary-hover text-center transition-colors text-sm shadow-sm"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
