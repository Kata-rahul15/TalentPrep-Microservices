import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Home,
  FileText,
  Briefcase,
  Bot,
  Video,
  UserRound,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/services/authService'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'
import { cn } from '@/lib/utils'

const mobilePrimaryNav = [
  {
    to: '/home',
    label: 'Home',
    icon: Home,
    match: (path: string) => path === '/home',
  },
  {
    to: '/resume',
    label: 'Resume',
    icon: FileText,
    match: (path: string) => path.startsWith('/resume'),
  },
  {
    to: '/interview',
    label: 'Interview',
    icon: Video,
    match: (path: string) => path.startsWith('/interview'),
  },
  {
    to: '/jobs',
    label: 'Jobs',
    icon: Briefcase,
    match: (path: string) => path.startsWith('/jobs'),
  },
  {
    to: '/agent',
    label: 'Career Agent',
    icon: Bot,
    match: (path: string) => path.startsWith('/agent'),
  },
]

const desktopNavItems = [
  {
    label: 'Home',
    to: '/home',
    match: (path: string) => path === '/home',
  },
  {
    label: 'Resume',
    to: '/resume',
    match: (path: string) => path.startsWith('/resume'),
  },
  {
    label: 'Mock Interview',
    to: '/interview',
    match: (path: string) => path.startsWith('/interview'),
  },
  {
    label: 'Jobs',
    to: '/jobs',
    match: (path: string) => path.startsWith('/jobs'),
  },
  {
    label: 'Career Agent',
    to: '/agent',
    match: (path: string) => path.startsWith('/agent'),
  },
  {
    label: 'Profile',
    to: '/profile',
    match: (path: string) => path.startsWith('/profile'),
  },
]

export default function AuthenticatedNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const userInitial = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'TP'

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      setMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  const goToProfile = () => {
    setMenuOpen(false)
    navigate('/profile')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E0D5] dark:border-[#232621] bg-[#FAF8F3]/95 dark:bg-[#080908]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#080908] dark:text-[#FAF8F3] hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C18] md:hidden cursor-pointer"
            aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link
            to="/home"
            onClick={() => setMenuOpen(false)}
            className="flex min-w-0 items-center"
            aria-label="TalentPrep home"
          >
            <TalentPrepLogo size="md" />
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav
          aria-label="Workspace navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {desktopNavItems.map((item) => {
            const active = item.match(location.pathname)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'relative py-1 text-xs font-semibold transition-colors duration-150',
                  active
                    ? 'text-[#080908] dark:text-[#FAF8F3] font-bold'
                    : 'text-[#2C2E2B] hover:text-[#080908] dark:text-[#E2DFD7] dark:hover:text-[#FAF8F3]'
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#CDF22B]" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Desktop account & logout */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={goToProfile}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C18] cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#080908] text-xs font-bold uppercase text-[#CDF22B]">
              {userInitial}
            </span>
            <span className="text-xs font-semibold text-[#080908] dark:text-[#FAF8F3]">
              {user?.username || 'User'}
            </span>
          </button>

          <span className="h-4 w-px bg-[#E5E0D5] dark:bg-[#232621]" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-xs font-semibold text-[#383B36] hover:text-[#DC2626] dark:text-[#BDB9AF] dark:hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </div>

      {/* Mobile-only primary workspace navigation */}
      <nav
        aria-label="Primary workspace navigation"
        className="grid grid-cols-5 gap-1 border-t border-[#E5E0D5] dark:border-[#232621] px-2 py-1 md:hidden"
      >
        {mobilePrimaryNav.map((item) => {
          const active = item.match(location.pathname)
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-center transition-colors',
                active
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

      {/* Mobile-only account menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-[#080908]/40" />

          <section
            aria-label="Account menu"
            className="absolute left-3 top-16 w-64 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-[#E5E0D5] dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] p-2 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={goToProfile}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[#FAF8F3] dark:hover:bg-[#181A16] cursor-pointer"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#080908] text-xs font-bold text-[#CDF22B]">
                {userInitial}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-[#080908] dark:text-[#FAF8F3]">
                  {user?.username || 'User'}
                </span>
                <span className="block truncate text-[10px] text-[#383B36] dark:text-[#BDB9AF]">
                  {user?.email || 'Profile'}
                </span>
              </span>

              <UserRound className="h-3.5 w-3.5 shrink-0 text-[#383B36] dark:text-[#BDB9AF]" />
            </button>

            <div className="my-1 border-t border-[#E5E0D5] dark:border-[#232621]" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
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
    </header>
  )
}
