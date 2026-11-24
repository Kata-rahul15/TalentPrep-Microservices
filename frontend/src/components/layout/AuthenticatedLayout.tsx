
import React, { useState, useEffect } from 'react'
import {
  Menu,
  Home,
  FileText,
  Briefcase,
  Sparkles,
  Video,
  X,
  LogOut,
  UserRound,
} from 'lucide-react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import AppSidebar from './AppSidebar'
import { useAuth } from '@/services/authService'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'
import { cn } from '@/lib/utils'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

const primaryNavItems = [
  {
    to: '/home',
    label: 'Home',
    icon: Home,
    match: (p: string) => p === '/home',
  },
  {
    to: '/resume',
    label: 'Resume',
    icon: FileText,
    match: (p: string) => p.startsWith('/resume'),
  },
  {
    to: '/interview',
    label: 'Interview',
    icon: Video,
    match: (p: string) => p.startsWith('/interview'),
  },
  {
    to: '/jobs',
    label: 'Jobs',
    icon: Briefcase,
    match: (p: string) => p.startsWith('/jobs'),
  },
  {
    to: '/agent',
    label: 'AI Agent',
    icon: Sparkles,
    match: (p: string) => p.startsWith('/agent'),
  },
]

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  // Explicit boolean typing fixes TS7006.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('talentprep_sidebar_collapsed')

      if (saved === null) {
        return false
      }

      const parsed: unknown = JSON.parse(saved)

      return typeof parsed === 'boolean' ? parsed : false
    } catch {
      return false
    }
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  useEffect(() => {
    try {
      localStorage.setItem(
        'talentprep_sidebar_collapsed',
        JSON.stringify(collapsed)
      )
    } catch {
      // Ignore unavailable localStorage.
    }
  }, [collapsed])

  // Close the mobile account menu when the route changes.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent background scrolling while the mobile menu is open.
  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  const navigateMobile = (path: string): void => {
    setMobileMenuOpen(false)
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-foreground selection:bg-blue-500/20 selection:text-blue-600 dark:bg-slate-950">
      {/* Desktop sidebar: visible only at md and above */}
      <div className="hidden md:block">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((previous: boolean) => !previous)}
        />
      </div>

      {/* Mobile authenticated workspace navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:bg-slate-900 md:hidden">
        {/* Row 1: Hamburger and branding */}
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((open: boolean) => !open)
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={
                mobileMenuOpen ? 'Close menu' : 'Open account menu'
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="authenticated-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateMobile('/home')}
              className="flex min-w-0 items-center"
              aria-label="Go to Home"
            >
              <TalentPrepLogo size="md" />
            </button>
          </div>
        </div>

        {/* Row 2: Primary workspace navigation */}
        <nav
          aria-label="Primary workspace navigation"
          className="grid grid-cols-5 gap-1 bg-white px-2 py-1.5 dark:bg-slate-900"
        >
          {primaryNavItems.map((item) => {
            const isActive = item.match(location.pathname)
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-0.5 text-center transition-colors',
                  isActive
                    ? 'border-blue-200/60 bg-blue-50 font-semibold text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'border-transparent text-slate-600 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span className="max-w-full truncate text-[11px] font-medium leading-none tracking-tight">
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </header>

      {/* Mobile account menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setMobileMenuOpen(false)}
          />

          <section
            id="authenticated-mobile-menu"
            aria-label="Account menu"
            className="fixed left-3 top-[60px] z-50 w-64 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => navigateMobile('/profile')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.username || 'User'}
                </span>

                <span className="block truncate text-xs text-muted-foreground">
                  {user?.email || 'View profile'}
                </span>
              </span>

              <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
            >
              {isLoggingOut ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}

              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </section>
        </div>
      )}

      {/* Main content: desktop sidebar spacing, full width on mobile */}
      <div
        className={cn(
          'flex min-h-[calc(100vh-112px)] flex-col transition-[padding] duration-300 ease-in-out md:min-h-screen',
          collapsed ? 'md:pl-16' : 'md:pl-[240px]'
        )}
      >
        <main className="flex w-full min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
