import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F3] dark:bg-[#080908] text-[#080908] dark:text-[#FAF8F3] flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden overflow-y-auto selection:bg-[#CDF22B] selection:text-[#080908]">
      
      {/* Subtle architectural grid pattern */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-grid-pattern opacity-40" />

      <div className="relative z-10 w-full max-w-[420px] mx-auto">
        {/* ── Top Header / Logo ── */}
        <div className="flex flex-col items-center mb-5 text-center">
          <Link
            to="/"
            className="flex items-center cursor-pointer mb-3"
          >
            <TalentPrepLogo size="md" />
          </Link>

          <h1 className="font-heading font-black text-xl sm:text-2xl text-[#080908] dark:text-[#FAF8F3] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs text-[#2C2E2B] dark:text-[#E2DFD7] max-w-[340px] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* ── Card Container ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </motion.div>

        {/* ── Back to Home Link ── */}
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#383B36] hover:text-[#080908] dark:text-[#BDB9AF] dark:hover:text-[#FAF8F3] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
