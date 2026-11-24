import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Briefcase,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export default function JobSearchSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const mockJobs = [
    {
      id: 'job-1',
      title: 'Senior Full Stack Engineer',
      company: 'Vercel',
      location: 'Remote · Worldwide',
      salary: '$145k – $185k',
      type: 'Full-time',
      matchScore: 96,
      skills: ['TypeScript', 'React.js', 'Next.js', 'Node.js'],
      posted: '2d ago',
      featured: true,
    },
    {
      id: 'job-2',
      title: 'Cloud Platform Architect',
      company: 'Datadog',
      location: 'Bengaluru / Hybrid',
      salary: '₹35L – ₹50L',
      type: 'Full-time',
      matchScore: 89,
      skills: ['AWS', 'Kubernetes', 'Golang', 'Terraform'],
      posted: '4d ago',
      featured: false,
    },
    {
      id: 'job-3',
      title: 'Senior Backend Developer',
      company: 'Stripe',
      location: 'Remote · US/EU/India',
      salary: '$150k – $190k',
      type: 'Full-time',
      matchScore: 92,
      skills: ['Distributed Systems', 'PostgreSQL', 'API Design'],
      posted: '1d ago',
      featured: false,
    },
  ]

  return (
    <section id="job-search" className="py-20 md:py-28 bg-secondary-bg/30 border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ── LEFT: Editorial Narrative & Value Proposition ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              AI Job Search
            </div>

            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-[1.15]">
              Find Roles Matched to Your Real Experience.
            </h2>

            <p className="text-secondary-foreground text-sm sm:text-base md:text-lg leading-relaxed">
              Search opportunities ranked by true skill alignment. Filter by work model, see compatibility scores, and focus on roles where your background stands out.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  title: 'Skill-Weighted Match Scoring',
                  desc: 'Understand exactly how your experience aligns with each opening, including matched skills and key requirements.',
                },
                {
                  title: 'Work Model & Role Filtering',
                  desc: 'Quickly find Remote, Hybrid, and On-site positions with transparent location and compensation details.',
                },
                {
                  title: 'Actionable Compatibility Insights',
                  desc: 'See your match percentage upfront to prioritize opportunities and apply with confidence.',
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
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm sm:text-base rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
              >
                <span>Explore Job Search</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* ── RIGHT: High-Fidelity Interactive Job Search UI Mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl border border-border bg-card shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden">
              
              {/* Explorer Search & Filter Bar */}
              <div className="p-4 sm:p-5 border-b border-border bg-secondary-bg/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Job Search Experience Preview
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Interactive Interface
                  </span>
                </div>

                {/* Mock Search Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7 relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl bg-card border border-border text-foreground truncate">
                      Full Stack Engineer Developer
                    </div>
                  </div>
                  <div className="sm:col-span-5 relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="w-full pl-8 pr-3 py-2 text-xs font-medium rounded-xl bg-card border border-border text-muted-foreground truncate">
                      Remote / All Locations
                    </div>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10.5px]">
                  <span className="px-2.5 py-1 rounded-lg bg-primary text-white font-bold">
                    All Models
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium">
                    Remote Only
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium">
                    Hybrid
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Past 30 Days
                  </span>
                </div>
              </div>

              {/* Mock Job Listing Cards */}
              <div className="p-4 sm:p-5 space-y-3">
                {mockJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      job.featured
                        ? 'bg-primary/[0.03] border-primary/30 shadow-xs'
                        : 'bg-card border-border hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-extrabold text-sm sm:text-base text-foreground">
                            {job.title}
                          </h4>
                          {job.featured && (
                            <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                              Top Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.company} · <span className="text-foreground/80 font-medium">{job.location}</span>
                        </p>
                      </div>

                      {/* Compatibility Badge */}
                      <div className="text-right flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/15 text-success text-xs font-black">
                          <Sparkles className="w-3 h-3" />
                          {job.matchScore}% Match
                        </span>
                        <span className="block text-[9px] text-muted-foreground mt-0.5">{job.posted}</span>
                      </div>
                    </div>

                    {/* Meta and Skills Row */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-divider">
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-secondary-bg border border-border text-[10px] font-medium text-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-foreground">
                        {job.salary}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
