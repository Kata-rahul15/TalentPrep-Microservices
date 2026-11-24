import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-2 sm:py-4 sm:px-6 lg:px-8 relative overflow-x-hidden overflow-y-auto font-sans select-none">
      
      {/* ── Ambient background blur circles ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 filter blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full bg-primary/5 filter blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] mx-auto px-4 sm:px-0">
        {/* ── Top Header/Nav ── */}
        <div className="flex flex-col items-center mb-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer group mb-2"
          >
            <div className="w-7.5 h-7.5 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-heading font-extrabold text-[1.15rem] tracking-tight text-foreground">
              TalentPrep
            </span>
          </Link>

          {/* Heading */}
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-foreground tracking-tight text-center">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground text-center max-w-[320px]">
              {subtitle}
            </p>
          )}
        </div>

        {/* ── Card/Forms Wrapper ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          {children}
        </motion.div>

        {/* ── Back to Home Link ── */}
        <div className="mt-3 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home page
          </Link>
        </div>
      </div>
    </div>
  )
}
