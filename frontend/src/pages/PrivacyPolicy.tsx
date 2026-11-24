import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, FileText, ChevronRight, AlertCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuthenticatedNavbar from '@/components/layout/AuthenticatedNavbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/services/authService'

const sections = [
  { id: 'information-we-collect', title: '1. Information We Collect' },
  { id: 'account-information', title: '2. Account Information' },
  { id: 'resume-documents', title: '3. Resume and Uploaded Documents' },
  { id: 'ai-processing', title: '4. AI Processing & Analysis' },
  { id: 'how-we-use-info', title: '5. How We Use Information' },
  { id: 'data-storage-security', title: '6. Data Storage and Security' },
  { id: 'third-party-services', title: '7. Third-Party Services' },
  { id: 'data-retention', title: '8. Data Retention' },
  { id: 'user-rights', title: '9. User Rights' },
  { id: 'account-deletion', title: '10. Account and Data Deletion' },
  { id: 'cookies-auth', title: '11. Cookies and Authentication' },
  { id: 'policy-updates', title: '12. Policy Updates' },
  { id: 'contact-information', title: '13. Contact Information' },
]

export default function PrivacyPolicy() {
  const { user } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {user ? <AuthenticatedNavbar /> : <Navbar />}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center sm:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Security Protocol</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Learn how TalentPrep handles your resume data, AI processing, personal information, and user account privacy.
          </p>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
            <span>Last Updated: October 2, 2026</span>
            <span>•</span>
            <span>Version 2.4</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Table of Contents Sticky Sidebar */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 bg-card border border-border rounded-2xl p-5 shadow-xs">
              <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {sections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                  >
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Privacy Policy Content */}
          <div className="lg:col-span-8 space-y-12 leading-relaxed text-sm text-secondary-foreground">
            {/* Section 1 */}
            <section id="information-we-collect" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
                1. Information We Collect
              </h2>
              <p>
                TalentPrep collects information necessary to deliver resume evaluation, job matching analysis, and interactive AI interview preparation simulations.
              </p>
              <p className="text-xs text-muted-foreground bg-secondary-bg p-3 rounded-xl border border-border">
                <strong>Data Categories:</strong> Information provided directly by you during registration, documents uploaded for analysis, and automated interaction telemetry.
              </p>
            </section>

            {/* Section 2 */}
            <section id="account-information" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                2. Account Information
              </h2>
              <p>
                When creating an account on TalentPrep, we collect your email address, username, and encrypted credentials. Account verification statuses (OTP verification) are stored in secure backend sessions.
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-primary/5 border border-primary/20 p-3 rounded-xl">
                [Confirmation Required]: Confirm identity provider token persistence rules with backend deployment.
              </p>
            </section>

            {/* Section 3 */}
            <section id="resume-documents" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                3. Resume and Uploaded Documents
              </h2>
              <p>
                When you upload a PDF or DOCX resume, our system extracts structural text content including work experience, skill tags, project highlights, and educational history.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                <li>Uploaded files are processed strictly for generating your candidate profile and ATS recommendations.</li>
                <li>Raw files are stored securely and never sold or shared with recruiters without explicit authorization.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="ai-processing" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                4. AI Processing & Analysis
              </h2>
              <p>
                TalentPrep utilizes AI models to evaluate resumes, calculate ATS keyword scores, match candidate profiles with job descriptions, and conduct mock interview simulations.
              </p>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  AI feedback and match metrics are generated programmatically to aid interview readiness. They do not constitute formal employment guarantees or official recruiter scoring standards.
                </span>
              </div>
            </section>

            {/* Section 5 */}
            <section id="how-we-use-info" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                5. How We Use Information
              </h2>
              <p>We use your information exclusively to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide ATS resume scoring, keyword breakdown, and optimization tips.</li>
                <li>Compare your resume against custom job descriptions to highlight matching and missing skills.</li>
                <li>Tailor AI interview roleplay scenarios to your target tech stack and career level.</li>
                <li>Maintain session security, user authentication, and system health.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="data-storage-security" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                6. Data Storage and Security
              </h2>
              <p>
                We implement industry-standard technical measures to safeguard user data, including HttpOnly JWT cookies for authenticated sessions and SSL/TLS encryption in transit.
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-secondary-bg border border-border p-3 rounded-xl">
                [Confirmation Required]: Verify encryption at rest parameters and database backup schedules.
              </p>
            </section>

            {/* Section 7 */}
            <section id="third-party-services" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                7. Third-Party Services
              </h2>
              <p>
                TalentPrep may integrate with trusted cloud infrastructure, AI model providers, and OAuth authentication providers (Google, GitHub). These partners process data strictly in accordance with contractual data protection standards.
              </p>
            </section>

            {/* Section 8 */}
            <section id="data-retention" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                8. Data Retention
              </h2>
              <p>
                We retain account data and resume evaluations as long as your account remains active. Users may clear uploaded resumes or request data purging at any time.
              </p>
            </section>

            {/* Section 9 */}
            <section id="user-rights" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                9. User Rights
              </h2>
              <p>You have the right to access, rectify, or export your candidate profile data. You may also request account deletion or object to specific processing features.</p>
            </section>

            {/* Section 10 */}
            <section id="account-deletion" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                10. Account and Data Deletion
              </h2>
              <p>
                Users can initiate an account deletion request through their Profile & Settings panel or by contacting support. Upon verification, associated personal data and resume records will be permanently removed.
              </p>
            </section>

            {/* Section 11 */}
            <section id="cookies-auth" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                11. Cookies and Authentication
              </h2>
              <p>
                TalentPrep uses essential session cookies (`tf_user` state and HttpOnly JWT access tokens) to maintain your login state securely across navigation requests. We do not sell tracking cookies to third-party ad networks.
              </p>
            </section>

            {/* Section 12 */}
            <section id="policy-updates" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                12. Policy Updates
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Material changes will be communicated via in-app notices or updated version indicators on this page.
              </p>
            </section>

            {/* Section 13 */}
            <section id="contact-information" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                13. Contact Information
              </h2>
              <p>
                If you have questions regarding this Privacy Policy or your data privacy rights, please reach out to our team:
              </p>
              <div className="p-4 rounded-xl bg-secondary-bg border border-border font-mono text-xs space-y-1">
                <p><strong>Email:</strong> privacy@talentprep.ai</p>
                <p><strong>Support Desk:</strong> TalentPrep Privacy & Compliance Team</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
