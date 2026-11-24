import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  Home,
  FileText,
  Briefcase,
  Sparkles,
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
    label: 'AI Agent',
    icon: Sparkles,
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
    label: 'Interview Studio',
    to: '/interview',
    match: (path: string) => path.startsWith('/interview'),
  },
  {
    label: 'Jobs',
    to: '/jobs',
    match: (path: string) => path.startsWith('/jobs'),
  },
  {
    label: 'AI Career Agent',
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
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-md dark:bg-slate-900/95">

      {/* Top row: hamburger, TalentPrep logo and profile avatar */}
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
            aria-expanded={menuOpen}
            aria-controls="authenticated-mobile-account-menu"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
          className="hidden items-center gap-6 md:flex lg:gap-8"
        >
          {desktopNavItems.map((item) => {
            const active = item.match(location.pathname)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'group relative py-1 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'font-bold text-primary'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'absolute -bottom-1 left-0 h-[2px] rounded-full bg-primary transition-all duration-200',
                    active ? 'w-full' : 'w-0 opacity-60 group-hover:w-full'
                  )}
                />
              </NavLink>
            )
          })}
        </nav>

        {/* Desktop account details and logout */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={goToProfile}
            className="group flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="View profile"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold uppercase text-primary">
              {userInitial}
            </span>

            <span className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight text-gray-900 group-hover:text-primary dark:text-white">
                {user?.username || 'User'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {user?.email || ''}
              </span>
            </span>
          </button>

          <span className="h-5 w-px bg-border" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
          >
            {isLoggingOut ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
        {/* 
        Mobile profile avatar
        <button
          type="button"
          onClick={goToProfile}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold uppercase text-primary transition-colors hover:bg-primary/15 md:hidden"
          aria-label="View user profile"
        >
          {userInitial}
        </button> */}
      </div>

      {/* Mobile-only primary workspace navigation */}
      <nav
        aria-label="Primary workspace navigation"
        className="grid grid-cols-5 gap-1 border-t border-slate-100 bg-white px-2 py-1.5 md:hidden dark:border-slate-800 dark:bg-slate-900"
      >
        {mobilePrimaryNav.map((item) => {
          const active = item.match(location.pathname)
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-0.5 text-center transition-colors',
                active
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

      {/* Mobile-only account menu: no public landing-page links */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20" />

          <section
            id="authenticated-mobile-account-menu"
            aria-label="Account menu"
            className="absolute left-3 top-16 w-64 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={goToProfile}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {userInitial}
              </span>

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
    </header>
  )
}
