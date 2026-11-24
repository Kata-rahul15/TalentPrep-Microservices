import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  Sparkles,
  Briefcase,
  Video,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { useAuth } from '@/services/authService'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'
import { cn } from '@/lib/utils'

const workspaceNav = [
  { to: '/home', label: 'Home', icon: Home, match: (p: string) => p === '/home' },
  { to: '/resume', label: 'Resume', icon: FileText, match: (p: string) => p.startsWith('/resume') },
  { to: '/interview', label: 'AI Interview', icon: Video, match: (p: string) => p.startsWith('/interview') },
  { to: '/jobs', label: 'Jobs', icon: Briefcase, match: (p: string) => p.startsWith('/jobs') },
  { to: '/agent', label: 'AI Career Agent', icon: Sparkles, match: (p: string) => p.startsWith('/agent') },
]

const accountNav = [
  { to: '/profile', label: 'Profile', icon: User, match: (p: string) => p === '/profile' },
  { to: '/settings', label: 'Settings', icon: Settings, match: (p: string) => p === '/settings' },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

/**
 * Robust portal tooltip that escapes sidebar overflow clipping when collapsed.
 */
function SidebarTooltip({
  label,
  show,
  children,
}: {
  label: string
  show: boolean
  children: React.ReactNode
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  if (!show) return <>{children}</>

  return (
    <div
      className="relative flex items-center justify-center w-full"
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setCoords({
          top: rect.top + rect.height / 2,
          left: rect.right + 10,
        })
      }}
      onMouseLeave={() => setCoords(null)}
    >
      {children}
      {coords &&
        createPortal(
          <div
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: 'translateY(-50%)',
            }}
            className="fixed z-50 px-2.5 py-1.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-xs font-medium rounded-lg shadow-lg border border-slate-700/60 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
          >
            {label}
          </div>,
          document.body
        )}
    </div>
  )
}

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
      setIsLoggingOut(false)
    }
  }

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out select-none',
        collapsed ? 'w-[64px]' : 'w-[240px]'
      )}
    >
      {/* ── Top Header Brand Row ── */}
      <div
        className={cn(
          'flex items-center h-14 border-b border-slate-200/70 dark:border-slate-800/70 flex-shrink-0 transition-all duration-300',
          collapsed ? 'justify-center px-2' : 'justify-between px-4 gap-3'
        )}
      >
        {collapsed ? (
          <SidebarTooltip label="Expand sidebar" show={true}>
            <button
              type="button"
              onClick={onToggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer focus:outline-none"
              aria-label="Expand sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SidebarTooltip>
        ) : (
          <>
            <div
              onClick={() => navigate('/home')}
              className="cursor-pointer group min-w-0 transition-opacity duration-200 flex-shrink-0"
            >
              <TalentPrepLogo size="md" />
            </div>

            {/* Expanded Menu Toggle Button */}
            <SidebarTooltip label="Collapse sidebar" show={true}>
              <button
                type="button"
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer flex-shrink-0 focus:outline-none"
                aria-label="Collapse sidebar"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
            </SidebarTooltip>
          </>
        )}
      </div>

      {/* ── Workspace Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="px-2 mb-1.5 transition-opacity duration-150">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Workspace
            </span>
          </div>
        )}

        {workspaceNav.map((item) => {
          const isActive = item.match(location.pathname)

          const navButton = (
            <NavLink
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-all duration-150 group h-9 w-full',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-900/50'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'w-4.5 h-4.5 flex-shrink-0 transition-transform duration-150',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:scale-105'
                )}
              />
              {!collapsed && (
                <span className="text-xs font-medium leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              )}
            </NavLink>
          )

          return (
            <div key={item.to} className="w-full flex justify-center">
              <SidebarTooltip label={item.label} show={collapsed}>
                {navButton}
              </SidebarTooltip>
            </div>
          )
        })}
      </nav>

      {/* ── Account Navigation ── */}
      <div className="px-2 pb-2 space-y-1 border-t border-slate-200/70 dark:border-slate-800/70 pt-2">
        {!collapsed && (
          <div className="px-2 mb-1 transition-opacity duration-150">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Account
            </span>
          </div>
        )}

        {accountNav.map((item) => {
          const isActive = item.match(location.pathname)

          const navButton = (
            <NavLink
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-all duration-150 h-8.5 w-full group',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-900/50'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-transform duration-150',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:scale-105'
                )}
              />
              {!collapsed && (
                <span className="text-xs font-medium leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              )}
            </NavLink>
          )

          return (
            <div key={item.to} className="w-full flex justify-center">
              <SidebarTooltip label={item.label} show={collapsed}>
                {navButton}
              </SidebarTooltip>
            </div>
          )
        })}

        {/* Logout button */}
        <div className="w-full flex justify-center">
          <SidebarTooltip label={isLoggingOut ? 'Logging out...' : 'Logout'} show={collapsed}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-all duration-150 w-full text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 disabled:bg-secondary-bg disabled:text-muted-foreground disabled:cursor-not-allowed cursor-pointer h-8.5 group',
                collapsed ? 'justify-center px-0' : 'px-2.5'
              )}
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <LogOut className="w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-105" />
              )}
              {!collapsed && (
                <span className="text-xs font-medium leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              )}
            </button>
          </SidebarTooltip>
        </div>
      </div>

      {/* ── User Profile Footer ── */}
      {user && (
        <div className="px-2 pb-2.5 border-t border-slate-200/70 dark:border-slate-800/70 pt-2 flex justify-center">
          {collapsed ? (
            <SidebarTooltip label={user.username || user.email || 'Profile'} show={true}>
              <div
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-200/60 dark:border-blue-900/60 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                {user.username?.slice(0, 2) || 'TP'}
              </div>
            </SidebarTooltip>
          ) : (
            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors w-full"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-blue-200/60 dark:border-blue-900/60">
                {user.username?.slice(0, 2) || 'TP'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user.username || 'User'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                  {user.email || ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
