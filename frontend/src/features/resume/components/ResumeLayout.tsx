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
  { to: '/resume/details', label: 'Details', icon: FileText },
  { to: '/resume/evaluation', label: 'ATS Analysis', icon: BarChart3 },
]

interface ResumeLayoutContentProps {
  children: React.ReactNode
}

function ResumeLayoutContent({ children }: ResumeLayoutContentProps) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4">
      {/* ── 1. Resume Workspace Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div>
          <h1 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight leading-tight">
            Resume Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            Analyze, improve, and build professional resumes with AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/resume/builder')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-2xs cursor-pointer h-8"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Resume</span>
          </button>
          <button
            onClick={() => navigate('/resume/upload')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-2xs cursor-pointer h-8"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Replace Resume</span>
          </button>
        </div>
      </div>

      {/* ── 2. Horizontal Secondary Resume Navbar ── */}
      <div className="border-b border-slate-200/80 dark:border-slate-800">
        <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-none pb-0">
          {resumeNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 py-2 px-0.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all flex-shrink-0 cursor-pointer',
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-3.5 h-3.5', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── 3. Subsection Content ── */}
      <main className="w-full">
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
