import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  Briefcase,
  Video,
  Bot,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '@/services/authService'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'
import { cn } from '@/lib/utils'

const workspaceNav = [
  { to: '/home', label: 'Home', icon: Home, match: (p: string) => p === '/home' },
  { to: '/resume', label: 'Resume', icon: FileText, match: (p: string) => p.startsWith('/resume') },
  { to: '/interview', label: 'Interview', icon: Video, match: (p: string) => p.startsWith('/interview') },
  { to: '/jobs', label: 'Jobs', icon: Briefcase, match: (p: string) => p.startsWith('/jobs') },
  { to: '/agent', label: 'Career Agent', icon: Bot, match: (p: string) => p.startsWith('/agent') },
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
 * Escaped portal tooltip for collapsed sidebar items
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
          left: rect.right + 8,
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
            className="fixed z-50 px-2.5 py-1 bg-[#080908] text-[#FAF8F3] text-xs font-medium rounded-md shadow-md border border-[#232621] pointer-events-none whitespace-nowrap animate-in fade-in duration-100 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
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
        'fixed top-0 left-0 z-40 h-screen flex flex-col bg-[#080908] text-[#FAF8F3] border-r border-[#1E201B] transition-all duration-200 ease-out select-none',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* ── Top Header Brand Row ── */}
      <div
        className={cn(
          'flex items-center h-14 border-b border-[#1E201B] flex-shrink-0 transition-all duration-200',
          collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
        )}
      >
        {collapsed ? (
          <SidebarTooltip label="Expand sidebar" show={true}>
            <button
              type="button"
              onClick={onToggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#D8D5CB] hover:text-[#FAF8F3] hover:bg-[#181A16] transition-colors cursor-pointer focus:outline-none"
              aria-label="Expand sidebar"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          </SidebarTooltip>
        ) : (
          <>
            <div
              onClick={() => navigate('/home')}
              className="cursor-pointer group min-w-0 flex-shrink-0"
            >
              <TalentPrepLogo size="md" inverted />
            </div>

            <SidebarTooltip label="Collapse sidebar" show={true}>
              <button
                type="button"
                onClick={onToggle}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[#BDB9AF] hover:text-[#FAF8F3] hover:bg-[#181A16] transition-colors cursor-pointer flex-shrink-0 focus:outline-none"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </SidebarTooltip>
          </>
        )}
      </div>

      {/* ── Workspace Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden" aria-label="Workspace Navigation">
        {!collapsed && (
          <div className="px-2.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#BDB9AF]">
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
                'flex items-center gap-2.5 rounded-lg transition-colors duration-150 h-9 w-full font-medium text-xs',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive
                  ? 'bg-[#CDF22B] text-[#080908] font-bold shadow-2xs'
                  : 'text-[#D8D5CB] hover:bg-[#181A16] hover:text-[#FAF8F3]'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-[#080908]' : 'text-[#D8D5CB]'
                )}
              />
              {!collapsed && (
                <span className="truncate">
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
      <div className="px-2 pb-2 space-y-1 border-t border-[#1E201B] pt-2.5">
        {!collapsed && (
          <div className="px-2.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#BDB9AF]">
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
                'flex items-center gap-2.5 rounded-lg transition-colors duration-150 h-8.5 w-full font-medium text-xs',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive
                  ? 'bg-[#CDF22B] text-[#080908] font-bold shadow-2xs'
                  : 'text-[#D8D5CB] hover:bg-[#181A16] hover:text-[#FAF8F3]'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-[#080908]' : 'text-[#D8D5CB]'
                )}
              />
              {!collapsed && (
                <span className="truncate">
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

        {/* Logout */}
        <div className="w-full flex justify-center pt-1">
          <SidebarTooltip label={isLoggingOut ? 'Logging out...' : 'Log out'} show={collapsed}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                'flex items-center gap-2.5 rounded-lg transition-colors duration-150 w-full text-[#D8D5CB] hover:bg-[#201414] hover:text-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-8.5 text-xs font-medium',
                collapsed ? 'justify-center px-0' : 'px-2.5'
              )}
            >
              {isLoggingOut ? (
                <div className="w-3.5 h-3.5 border-2 border-[#D8D5CB] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <LogOut className="w-4 h-4 flex-shrink-0" />
              )}
              {!collapsed && (
                <span className="truncate">
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </span>
              )}
            </button>
          </SidebarTooltip>
        </div>
      </div>

      {/* ── User Profile Footer ── */}
      {user && (
        <div className="px-2 pb-2.5 border-t border-[#1E201B] pt-2 flex justify-center">
          {collapsed ? (
            <SidebarTooltip label={user.username || user.email || 'Profile'} show={true}>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-lg bg-[#181A16] text-[#CDF22B] flex items-center justify-center font-bold text-xs uppercase border border-[#282B24] cursor-pointer hover:border-[#CDF22B] transition-colors"
              >
                {user.username?.slice(0, 2) || 'TP'}
              </button>
            </SidebarTooltip>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#181A16] cursor-pointer transition-colors w-full text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#181A16] text-[#CDF22B] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 border border-[#282B24]">
                {user.username?.slice(0, 2) || 'TP'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#FAF8F3] truncate leading-tight">
                  {user.username || 'User'}
                </p>
                <p className="text-[11px] text-[#BDB9AF] truncate leading-tight mt-0.5">
                  {user.email || 'Account'}
                </p>
              </div>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
