import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FileEdit,
  Download,
  CheckCircle2,
  ArrowRight,
  Eye,
  FileCheck,
} from 'lucide-react'

export default function ResumeBuilderSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="resume-builder" className="py-20 md:py-28 bg-secondary-bg/30 border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ── LEFT: High-Fidelity Interactive Resume Builder Mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 order-2 lg:order-1"
          >
            <div className="rounded-3xl border border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
              
              {/* Builder Top Bar */}
              <div className="px-5 py-3.5 border-b border-border bg-secondary-bg/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center">
                    <FileEdit className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-heading font-bold text-xs sm:text-sm text-foreground">
                    TalentPrep Resume Studio
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-semibold text-foreground flex items-center gap-1 shadow-2xs">
                    <Eye className="w-3 h-3 text-primary" /> Live Preview
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                    <Download className="w-3 h-3" /> Export PDF
                  </span>
                </div>
              </div>

              {/* Main Builder Canvas Split */}
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Left Mini Column: Section Navigator */}
                <div className="sm:col-span-4 space-y-2 border-r border-border pr-2 sm:pr-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Sections
                  </span>
                  {[
                    { name: 'Contact & Header', status: 'Complete' },
                    { name: 'Summary & Narrative', status: 'AI Optimized' },
                    { name: 'Work Experience', status: '3 Roles' },
                    { name: 'Technical Skills', status: '18 Skills' },
                    { name: 'Education & Certs', status: 'Verified' },
                  ].map((sec, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        idx === 1
                          ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                          : 'bg-secondary-bg/50 border-border text-foreground font-medium hover:border-primary/20'
                      }`}
                    >
                      <span className="text-xs block truncate">{sec.name}</span>
                      <span className="text-[9.5px] text-muted-foreground font-normal">{sec.status}</span>
                    </div>
                  ))}
                </div>

                {/* Right Mini Column: Realtime A4 Document Canvas Preview */}
                <div className="sm:col-span-8 p-4 rounded-2xl bg-secondary-bg/30 border border-border space-y-3">
                  {/* Resume Header Preview */}
                  <div className="border-b border-border pb-3">
                    <h3 className="font-heading font-extrabold text-base text-foreground">
                      Rahul Sharma
                    </h3>
                    <p className="text-[11px] text-primary font-semibold">
                      Senior Full Stack & Cloud Platform Engineer
                    </p>
                    <p className="text-[9.5px] text-muted-foreground mt-0.5">
                      rahul.sharma@example.com · linkedin.com/in/rahul-eng · Bengaluru, India
                    </p>
                  </div>

                  {/* Summary Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Professional Summary
                    </span>
                    <p className="text-[10.5px] text-secondary-foreground leading-relaxed bg-card p-2 rounded-lg border border-border">
                      Results-driven Engineer with 6+ years of experience designing scalable distributed backend microservices and modern React applications. Proven track record in reducing system latency by 35% and mentoring engineering squads.
                    </p>
                  </div>

                  {/* Skills Pills in Document */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Key Competencies
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {['TypeScript', 'React.js', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'AWS ECS', 'System Design'].map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-card border border-border text-[9px] font-medium text-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ATS Format Check Badge */}
                  <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-success">
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" /> Single-Column Standard ATS Format
                    </span>
                    <span>100% Parser Compliant</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

          {/* ── RIGHT: Editorial Copy & Value Proposition ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6 text-left order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <FileEdit className="w-3.5 h-3.5" />
              Resume Studio & Builder
            </div>

            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-[1.15]">
              Turn Career Information Into a Stronger Resume.
            </h2>

            <p className="text-secondary-foreground text-sm sm:text-base md:text-lg leading-relaxed">
              Build clean, recruiter-approved resumes backed by your extracted profile. No painful formatting battles in Word or brittle template software.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                {
                  title: 'Seamless Profile Data Import',
                  desc: 'All parsed skills, experiences, and metrics automatically populate into your editable builder.',
                },
                {
                  title: 'Recruiter & ATS Optimized Layouts',
                  desc: 'Crafted to parse flawlessly through applicant tracking systems without formatting glitches.',
                },
                {
                  title: 'Instant High-Resolution PDF Export',
                  desc: 'Download clean, print-ready PDFs formatted for corporate recruiters and startups alike.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-heading font-bold text-sm sm:text-base text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Build Your Resume</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
