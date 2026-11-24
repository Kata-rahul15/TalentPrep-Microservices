import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Shield, X, Check, ArrowDown, CheckCircle2, AlertCircle } from 'lucide-react'

interface LegalConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmConsent: () => void
  initialConsentState?: boolean
}

export default function LegalConsentModal({
  isOpen,
  onClose,
  onConfirmConsent,
  initialConsentState = false,
}: LegalConsentModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isConsentChecked, setIsConsentChecked] = useState(initialConsentState)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false)
      setIsConsentChecked(initialConsentState)

      // Lock body scroll
      document.body.style.overflow = 'hidden'

      // Check if content fits without scrolling after DOM render
      const timer = setTimeout(() => {
        const el = scrollRef.current
        if (el) {
          if (el.scrollHeight <= el.clientHeight + 10) {
            setHasScrolledToBottom(true)
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, initialConsentState])

  // Cleanup body scroll lock on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Handle scroll detection
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || hasScrolledToBottom) return

    // 15px threshold for bottom scroll detection
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 15
    if (isAtBottom) {
      setHasScrolledToBottom(true)
    }
  }

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOK = () => {
    if (isConsentChecked && hasScrolledToBottom) {
      onConfirmConsent()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
      >
        {/* Dimmed backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[82vh] text-foreground"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 id="consent-modal-title" className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight">
                  Terms & Conditions and Privacy Policy
                </h2>
                <p className="text-xs text-muted-foreground">
                  Please scroll to the end of both documents to provide your consent.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary-bg transition-colors cursor-pointer"
              aria-label="Close legal consent modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Single Scrollable Container for both documents */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-8 text-xs sm:text-sm leading-relaxed text-secondary-foreground select-text"
          >
            {/* Scroll Indicator Prompt */}
            {!hasScrolledToBottom && (
              <div className="sticky top-0 z-20 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center justify-between shadow-xs mb-4">
                <span className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  Scroll to the bottom of the Privacy Policy to unlock consent.
                </span>
                <span className="text-[11px] opacity-80">Read both documents below</span>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* DOCUMENT 1: TERMS & CONDITIONS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <article className="space-y-4 border-b border-border pb-8">
              <div className="flex items-center gap-2 text-primary font-bold text-base border-b border-border pb-2">
                <FileText className="w-5 h-5" />
                <h3>Part 1: Terms & Conditions</h3>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
                <strong>AI Service Disclaimer:</strong> TalentPrep's resume analysis, job matching scores, and mock interview feedback are informational self-preparation tools. They do not guarantee job interviews or employment outcomes.
              </div>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">1. Acceptance of Terms</h4>
                <p>By creating an account on TalentPrep, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, you may not use the service.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">2. Eligibility & Account Security</h4>
                <p>You must be at least 18 years of age to register. You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">3. Acceptable Use</h4>
                <p>You agree not to misuse TalentPrep services. Prohibited behavior includes automated scraping, API abuse, uploading malicious files, or attempting unauthorized system access.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">4. Resume Uploads & Intellectual Property</h4>
                <p>You retain full ownership of uploaded resume files and job descriptions. By uploading documents, you grant TalentPrep a license to process the content solely for generating your requested evaluations.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">5. Service Availability & Limitation of Liability</h4>
                <p>Services are provided "as-is". TalentPrep does not warrant uninterrupted service access and shall not be liable for indirect damages resulting from platform use.</p>
              </section>
            </article>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* DOCUMENT 2: PRIVACY POLICY */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <article className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-primary font-bold text-base border-b border-border pb-2">
                <Shield className="w-5 h-5" />
                <h3>Part 2: Privacy Policy</h3>
              </div>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">1. Information We Collect</h4>
                <p>TalentPrep collects your email, username, encrypted password hashes, uploaded resume text, job match inputs, and mock interview practice telemetry.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">2. How We Use Your Information</h4>
                <p>We use collected information exclusively to provide resume ATS scoring, job description match analysis, tailored AI interview roleplay, and account security maintenance.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">3. Data Privacy & No Selling</h4>
                <p>Your resume data and contact information are strictly private. We do not sell or rent your personal data or resume records to third-party ad networks or recruiters.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">4. Cookies & Session Management</h4>
                <p>TalentPrep uses essential session state (`tf_user`) and HttpOnly JWT cookies to keep your account securely authenticated across pages.</p>
              </section>

              <section className="space-y-2">
                <h4 className="font-heading font-bold text-foreground">5. Data Deletion Rights</h4>
                <p>You may request full account and resume data deletion at any time by contacting support@talentprep.ai.</p>
              </section>

              <div className="p-3 bg-secondary-bg border border-border rounded-xl text-xs text-muted-foreground">
                End of Privacy Policy & Terms & Conditions. You have reached the end of both documents.
              </div>
            </article>
          </div>

          {/* Modal Footer Controls (Checkbox & OK Button) */}
          <div className="px-6 py-4 border-t border-border bg-card flex-shrink-0 space-y-3">
            {/* Scroll status indicator */}
            {!hasScrolledToBottom ? (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Please scroll to the bottom of the document to enable consent checkbox.</span>
              </p>
            ) : (
              <p className="text-xs font-semibold text-success flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>You have reviewed both documents. Consent checkbox is now enabled.</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Consent Checkbox */}
              <label className={`flex items-start gap-2.5 text-xs font-semibold cursor-pointer select-none ${
                !hasScrolledToBottom ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'text-foreground'
              }`}>
                <input
                  type="checkbox"
                  checked={isConsentChecked}
                  onChange={(e) => setIsConsentChecked(e.target.checked)}
                  disabled={!hasScrolledToBottom}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer disabled:cursor-not-allowed"
                />
                <span>
                  I have read and agree to both the Terms & Conditions and Privacy Policy.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-secondary-bg hover:bg-border text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleOK}
                  disabled={!hasScrolledToBottom || !isConsentChecked}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover disabled:bg-secondary-bg disabled:text-muted-foreground text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>OK</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
