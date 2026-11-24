import React, { useState, useEffect } from 'react'
import {
  Menu,
  Home,
  FileText,
  Briefcase,
  Video,
  Bot,
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
    label: 'Career Agent',
    icon: Bot,
    match: (p: string) => p.startsWith('/agent'),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: UserRound,
    match: (p: string) => p === '/profile' || p === '/settings',
  },
]

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('talentprep_sidebar_collapsed')
      if (saved === null) return false
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
      localStorage.setItem('talentprep_sidebar_collapsed', JSON.stringify(collapsed))
    } catch {
      // Ignore localStorage exceptions
    }
  }, [collapsed])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
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
    <div className="min-h-screen w-full bg-[#FAF8F3] dark:bg-[#080908] text-[#080908] dark:text-[#FAF8F3] antialiased selection:bg-[#CDF22B] selection:text-[#080908] flex flex-col">
      {/* Desktop sidebar: fixed left */}
      <div className="hidden md:block">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((previous) => !previous)}
        />
      </div>

      {/* Mobile authenticated workspace navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E0D5] bg-[#FAF8F3]/95 backdrop-blur-md dark:border-[#232621] dark:bg-[#080908]/95 md:hidden">
        {/* Row 1: Hamburger and branding */}
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#080908] hover:bg-[#F2EFE9] focus-visible:outline-none dark:text-[#FAF8F3] dark:hover:bg-[#1A1C18]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open account menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

          {user && (
            <button
              type="button"
              onClick={() => navigateMobile('/profile')}
              className="w-8 h-8 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-xs uppercase"
            >
              {user.username?.slice(0, 2) || 'TP'}
            </button>
          )}
        </div>

        {/* Row 2: Mobile Tab Bar */}
        <nav
          aria-label="Primary mobile workspace navigation"
          className="grid grid-cols-6 gap-1 border-t border-[#E5E0D5] px-2 py-1 dark:border-[#232621]"
        >
          {primaryNavItems.map((item) => {
            const isActive = item.match(location.pathname)
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-center transition-colors',
                  isActive
                    ? 'bg-[#CDF22B] text-[#080908] font-bold shadow-2xs'
                    : 'text-[#383B36] hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C18] dark:text-[#BDB9AF]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </header>

      {/* Mobile account drawer dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 bg-[#080908]/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          <section
            aria-label="Account menu"
            className="fixed left-3 top-16 z-50 w-64 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-[#E5E0D5] bg-[#FFFFFF] p-2 shadow-xl dark:border-[#232621] dark:bg-[#121311]"
          >
            <button
              type="button"
              onClick={() => navigateMobile('/profile')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#FAF8F3] dark:hover:bg-[#1A1C18]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-[#080908] dark:text-[#FAF8F3]">
                  {user?.username || 'User'}
                </span>
                <span className="block truncate text-xs text-[#383B36] dark:text-[#BDB9AF]">
                  {user?.email || 'View profile'}
                </span>
              </span>
              <UserRound className="h-4 w-4 shrink-0 text-[#383B36] dark:text-[#BDB9AF]" />
            </button>

            <div className="my-1 border-t border-[#E5E0D5] dark:border-[#232621]" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#DC2626] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
            >
              {isLoggingOut ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
          </section>
        </div>
      )}

      {/* Main Content: dynamically responds to sidebar collapsed / expanded state */}
      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-[margin-left] duration-200 ease-out',
          collapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        <main className="flex w-full min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
