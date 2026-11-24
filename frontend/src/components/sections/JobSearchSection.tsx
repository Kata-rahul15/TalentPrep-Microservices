import { Link } from 'react-router-dom'
import {
  Briefcase,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react'

export default function JobSearchSection() {
  const mockJobs = [
    {
      id: 'job-1',
      title: 'Senior Full Stack Engineer',
      company: 'Vercel',
      location: 'Remote · Worldwide',
      salary: '$145k – $185k',
      type: 'Full-time',
      matchScore: 96,
      skills: ['TypeScript', 'React', 'Next.js', 'Node.js'],
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
      location: 'Remote · US / EU / India',
      salary: '$150k – $190k',
      type: 'Full-time',
      matchScore: 92,
      skills: ['Distributed Systems', 'PostgreSQL', 'API Design'],
      posted: '1d ago',
      featured: false,
    },
  ]

  return (
    <section id="job-search" className="py-20 md:py-28 bg-[#FFFFFF] dark:bg-[#080908] border-t border-[#E5E0D5] dark:border-[#232621] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ── LEFT: Value Proposition ── */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F3] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
              Role Matching Engine
            </div>

            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#080908] dark:text-[#FAF8F3] tracking-tight leading-[1.12]">
              Roles matched directly to your verified skills
            </h2>

            <p className="text-[#40433C] dark:text-[#B8BCAE] text-sm sm:text-base leading-relaxed">
              Search engineering and technical opportunities ranked by skill compatibility. Filter by work model, see match breakdowns upfront, and prioritize positions where your background is competitive.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  title: 'Skill-weighted match scoring',
                  desc: 'Inspect exact alignment against requirements, including identified strengths and missing keywords.',
                },
                {
                  title: 'Work model and role filters',
                  desc: 'Isolate remote, hybrid, and on-site listings with verified compensation ranges.',
                },
                {
                  title: 'Compatibility telemetry',
                  desc: 'Benchmark your profile against job descriptions to target your preparation before submitting.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#080908] dark:text-[#CDF22B] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#080908] dark:text-[#FAF8F3]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#383B36] dark:text-[#BDB9AF] leading-relaxed mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#080908] hover:bg-[#1A1C18] text-[#FAF8F3] font-bold text-sm rounded-lg transition-colors cursor-pointer"
              >
                <span>Explore job matching</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Job Search Preview UI ── */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#080908]/12 bg-[#FAF8F3] dark:bg-[#121311] dark:border-[#232621] shadow-sm overflow-hidden">
              
              {/* Header Bar */}
              <div className="p-4 border-b border-[#E5E0D5] dark:border-[#232621] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#080908] dark:text-[#CDF22B]" />
                    Job Matching Explorer
                  </span>
                  <span className="text-[11px] font-mono text-[#383B36] dark:text-[#BDB9AF]">
                    LIVE PREVIEW
                  </span>
                </div>

                {/* Search Bar Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7 relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#383B36] dark:text-[#BDB9AF]" />
                    <div className="w-full pl-8 pr-3 py-2 text-xs font-medium rounded-lg bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] truncate">
                      Full Stack Engineer / Platform
                    </div>
                  </div>
                  <div className="sm:col-span-5 relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#383B36] dark:text-[#BDB9AF]" />
                    <div className="w-full pl-8 pr-3 py-2 text-xs font-medium rounded-lg bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#383B36] dark:text-[#BDB9AF] truncate">
                      Remote / Worldwide
                    </div>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-[#CDF22B] text-[#080908] font-bold text-[11px]">
                    All Models
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] font-medium text-[11px]">
                    Remote
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] font-medium text-[11px]">
                    Hybrid
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#383B36] dark:text-[#BDB9AF] font-medium text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Past 30 days
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="p-4 space-y-2.5">
                {mockJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-lg border border-[#E5E0D5] dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#181A16] transition-all hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-[#080908] dark:text-[#FAF8F3]">
                            {job.title}
                          </h4>
                          {job.featured && (
                            <span className="px-1.5 py-0.5 rounded bg-[#080908] text-[#CDF22B] text-[9px] font-mono font-bold uppercase">
                              Top Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#383B36] dark:text-[#BDB9AF] mt-0.5">
                          {job.company} · <span className="text-[#080908] dark:text-[#FAF8F3] font-medium">{job.location}</span>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#CDF22B] text-xs font-mono font-bold tabular-nums">
                          {job.matchScore}% Match
                        </span>
                        <span className="block text-[10px] text-[#383B36] dark:text-[#BDB9AF] mt-0.5">{job.posted}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E0D5] dark:border-[#232621]">
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[10px] font-mono text-[#080908] dark:text-[#FAF8F3]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-mono font-bold text-[#080908] dark:text-[#FAF8F3] tabular-nums">
                        {job.salary}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
