import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Settings,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/services/authService'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'
import { cn } from '@/lib/utils'

const accountNav = [
  { to: '/profile', label: 'Profile', icon: User, match: (p: string) => p === '/profile' },
  { to: '/settings', label: 'Settings', icon: Settings, match: (p: string) => p === '/settings' },
]

const infoNav = [
  { to: '/help', label: 'Help & Support', icon: HelpCircle, match: (p: string) => p === '/help' || p === '/faq' },
  { to: '/terms-and-conditions', label: 'Terms & Conditions', icon: FileCheck, match: (p: string) => p === '/terms-and-conditions' },
  { to: '/privacy-policy', label: 'Privacy Policy', icon: ShieldCheck, match: (p: string) => p === '/privacy-policy' },
]

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  // Close on route change
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      onClose()
    } catch (err) {
      console.error('Logout failed:', err)
      setIsLoggingOut(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-border shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-border flex-shrink-0">
              <TalentPrepLogo size="sm" />
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#383B36] hover:text-[#080908] dark:text-[#BDB9AF] dark:hover:text-[#FAF8F3] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Body */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain">
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#383B36] dark:text-[#BDB9AF]">
                  Account & Preferences
                </span>
              </div>
              {accountNav.map((item) => {
                const isActive = item.match(location.pathname)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#CDF22B] text-[#080908] font-bold shadow-xs border border-[#b8dc22]'
                        : 'text-[#2C2E2B] dark:text-[#E2DFD7] hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}

              <div className="pt-4 pb-2 px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#383B36] dark:text-[#BDB9AF]">
                  Support & Legal
                </span>
              </div>
              {infoNav.map((item) => {
                const isActive = item.match(location.pathname)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#CDF22B] text-[#080908] font-bold shadow-xs border border-[#b8dc22]'
                        : 'text-[#2C2E2B] dark:text-[#E2DFD7] hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}

              <div className="pt-4 border-t border-border mt-3">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 disabled:bg-secondary-bg disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors w-full cursor-pointer"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
                  )}
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            </nav>

            {/* User card footer */}
            {user && (
              <div className="px-4 py-3 border-t border-border bg-[#080908]/[0.02] dark:bg-white/[0.02] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#CDF22B] text-[#080908] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                    {user.username?.slice(0, 2) || 'TP'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#080908] dark:text-[#FAF8F3] truncate">
                      {user.username || 'User'}
                    </p>
                    <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF] font-medium truncate">
                      {user.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
