import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  RefreshCw,
  FileEdit,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ResumeProcessingModal from './ResumeProcessingModal'

const resumeNavItems = [
  { to: '/resume', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/resume/builder', label: 'Resume Builder', icon: FileEdit },
  { to: '/resume/details', label: 'Details & Skills', icon: FileText },
  { to: '/resume/evaluation', label: 'ATS Analysis', icon: BarChart3 },
]

interface ResumeLayoutContentProps {
  children: React.ReactNode
}

function ResumeLayoutContent({ children }: ResumeLayoutContentProps) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* ── 1. Resume Workspace Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[#E5E0D5] dark:border-[#232621]">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#080908] text-[#FAF8F3] text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
              RESUME INTELLIGENCE
            </span>
          </div>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-[#080908] dark:text-[#FAF8F3] tracking-tight">
            Resume Intelligence Workspace
          </h1>
          <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] mt-0.5">
            Inspect ATS readiness scores, structure career taxonomy, and draft optimized resumes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/resume/builder')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#BCE01E] rounded-lg transition-colors cursor-pointer shadow-2xs h-8"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create resume</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/resume/upload')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#080908] dark:text-[#FAF8F3] bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-lg hover:bg-[#FAF8F3] dark:hover:bg-[#181A16] transition-colors cursor-pointer h-8"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#383B36] dark:text-[#BDB9AF]" />
            <span>Replace file</span>
          </button>
        </div>
      </div>

      {/* ── 2. Horizontal Secondary Resume Navbar ── */}
      <div className="border-b border-[#E5E0D5] dark:border-[#232621]">
        <nav className="flex space-x-6 overflow-x-auto scrollbar-none pb-0">
          {resumeNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 py-2.5 px-0.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer',
                  isActive
                    ? 'border-[#080908] dark:border-[#CDF22B] text-[#080908] dark:text-[#FAF8F3] font-bold'
                    : 'border-transparent text-[#383B36] hover:text-[#080908] dark:text-[#BDB9AF] dark:hover:text-[#FAF8F3]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-3.5 h-3.5', isActive ? 'text-[#080908] dark:text-[#CDF22B]' : 'text-[#383B36] dark:text-[#BDB9AF]')} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── 3. Subsection Content ── */}
      <main className="w-full min-w-0">
        {children}
      </main>

      {/* ── 4. Global Processing Modal ── */}
      <ResumeProcessingModal />
    </div>
  )
}

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <ResumeLayoutContent>{children}</ResumeLayoutContent>
}
