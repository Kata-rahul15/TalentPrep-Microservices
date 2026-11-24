import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileCheck, ChevronRight, AlertTriangle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuthenticatedNavbar from '@/components/layout/AuthenticatedNavbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/services/authService'

const sections = [
  { id: 'acceptance-terms', title: '1. Acceptance of Terms' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'account-responsibilities', title: '3. Account Responsibilities' },
  { id: 'acceptable-use', title: '4. Acceptable Use' },
  { id: 'resume-uploads', title: '5. Resume Uploads' },
  { id: 'ai-generated-content', title: '6. AI-Generated Content Disclaimer' },
  { id: 'job-matching-limitations', title: '7. Job Matching Limitations' },
  { id: 'interview-limitations', title: '8. Interview Simulation Limitations' },
  { id: 'intellectual-property', title: '9. Intellectual Property' },
  { id: 'service-availability', title: '10. Service Availability' },
  { id: 'suspension-termination', title: '11. Account Suspension & Termination' },
  { id: 'limitation-liability', title: '12. Limitation of Liability' },
  { id: 'changes-to-terms', title: '13. Changes to Terms' },
  { id: 'contact-info', title: '14. Contact Information' },
]

export default function TermsAndConditions() {
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
            <FileCheck className="w-3.5 h-3.5" />
            <span>Service Agreement & Policies</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight">
            Terms & Conditions
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Please review the terms governing your use of TalentPrep's resume analysis, job matching, and AI interview simulation console.
          </p>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
            <span>Effective Date: October 2, 2026</span>
            <span>•</span>
            <span>Version 1.8</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Table of Contents Sidebar */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 bg-card border border-border rounded-2xl p-5 shadow-xs">
              <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                Terms Contents
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

          {/* Terms Content */}
          <div className="lg:col-span-8 space-y-12 leading-relaxed text-sm text-secondary-foreground">
            {/* Disclaimer Banner */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Important AI Service Disclaimer</span>
              </div>
              <p className="text-xs leading-relaxed">
                TalentPrep's AI resume feedback, job matching scores, ATS evaluations, and mock interview feedback are informational self-preparation tools. They do not guarantee job interviews, offers, or employment outcomes with third-party companies.
              </p>
            </div>

            {/* Section 1 */}
            <section id="acceptance-terms" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                1. Acceptance of Terms
              </h2>
              <p>
                By registering for an account or using TalentPrep, you agree to comply with and be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, you may not access the service.
              </p>
            </section>

            {/* Section 2 */}
            <section id="eligibility" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                2. Eligibility
              </h2>
              <p>
                You must be at least 18 years old or the age of legal majority in your jurisdiction to create an account and use TalentPrep.
              </p>
            </section>

            {/* Section 3 */}
            <section id="account-responsibilities" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                3. Account Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account. Promptly notify TalentPrep of any unauthorized account access.
              </p>
            </section>

            {/* Section 4 */}
            <section id="acceptable-use" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                4. Acceptable Use
              </h2>
              <p>You agree not to misuse TalentPrep services. Prohibited actions include:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                <li>Automated scraping, bulk submission, or reverse engineering of AI models and backend APIs.</li>
                <li>Uploading malicious payloads, virus-infected documents, or fraudulent content.</li>
                <li>Attempting to bypass authentication guards or single-refresh security mechanisms.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="resume-uploads" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                5. Resume Uploads
              </h2>
              <p>
                You retain full ownership of the resume documents and job descriptions you submit. By uploading documents, you grant TalentPrep a non-exclusive license to store and process the text solely to provide your requested evaluation features.
              </p>
            </section>

            {/* Section 6 */}
            <section id="ai-generated-content" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                6. AI-Generated Content Disclaimer
              </h2>
              <p>
                Insights, score breakdowns, suggestions, and responses generated by TalentPrep AI are produced programmatically based on language patterns and algorithm metrics.
              </p>
              <p className="text-xs text-muted-foreground bg-secondary-bg p-3 rounded-xl border border-border">
                Content is provided "as-is" for candidate practice and self-improvement. We make no representations regarding absolute ATS pass rates across external hiring software.
              </p>
            </section>

            {/* Section 7 */}
            <section id="job-matching-limitations" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                7. Job Matching Limitations
              </h2>
              <p>
                Job match percentages measure keyword and experience overlap against user-provided text snippets. High match scores do not guarantee employer interview callbacks or hiring selections.
              </p>
            </section>

            {/* Section 8 */}
            <section id="interview-limitations" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                8. Interview Simulation Limitations
              </h2>
              <p>
                Interactive interview simulations provide simulated roleplay practice. Ratings and suggested answers should be used as guidance alongside real-world preparation and technical study.
              </p>
            </section>

            {/* Section 9 */}
            <section id="intellectual-property" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                9. Intellectual Property
              </h2>
              <p>
                The TalentPrep software platform, visual interface, brand assets, domain name, design tokens, and core analytics engine are protected by copyright, trademark, and intellectual property laws.
              </p>
            </section>

            {/* Section 10 */}
            <section id="service-availability" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                10. Service Availability
              </h2>
              <p>
                We strive for continuous availability but do not warrant uninterrupted access. Scheduled backend updates, server maintenance, or third-party outages may temporarily impact service access.
              </p>
            </section>

            {/* Section 11 */}
            <section id="suspension-termination" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                11. Account Suspension & Termination
              </h2>
              <p>
                TalentPrep reserves the right to suspend or terminate accounts that violate acceptable use guidelines, engage in API abuse, or attempt unauthorized system access.
              </p>
            </section>

            {/* Section 12 */}
            <section id="limitation-liability" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                12. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, TalentPrep shall not be liable for indirect, incidental, or consequential damages resulting from your use of or inability to use the service.
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-secondary-bg border border-border p-3 rounded-xl">
                [Confirmation Required]: Confirm governing legal jurisdiction and liability caps with corporate legal counsel.
              </p>
            </section>

            {/* Section 13 */}
            <section id="changes-to-terms" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                13. Changes to Terms
              </h2>
              <p>
                We reserve the right to revise these Terms at any time. Continued use of the platform following published changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            {/* Section 14 */}
            <section id="contact-info" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
              <h2 className="font-heading font-bold text-xl text-foreground">
                14. Contact Information
              </h2>
              <p>For questions or support regarding these Terms & Conditions, please contact us:</p>
              <div className="p-4 rounded-xl bg-secondary-bg border border-border font-mono text-xs space-y-1">
                <p><strong>Email:</strong> legal@talentprep.ai</p>
                <p><strong>Support Desk:</strong> TalentPrep Legal & Customer Operations</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
