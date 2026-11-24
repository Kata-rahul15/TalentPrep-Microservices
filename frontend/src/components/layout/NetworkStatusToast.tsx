import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, X } from 'lucide-react'

export default function NetworkStatusToast() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showOnlineToast, setShowOnlineToast] = useState(false)
  const [dismissedOffline, setDismissedOffline] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      setDismissedOffline(false)
      setShowOnlineToast(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowOnlineToast(true)
      // Hide "Back online" notification after 4 seconds
      const timer = setTimeout(() => {
        setShowOnlineToast(false)
      }, 4000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-none flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {/* Offline Warning Banner */}
        {isOffline && !dismissedOffline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto bg-amber-900 text-amber-50 border border-amber-700/60 rounded-2xl p-4 shadow-xl flex items-start justify-between gap-3"
            role="status"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-800 flex items-center justify-center flex-shrink-0 text-amber-200 mt-0.5">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Connection Lost
                </p>
                <p className="text-xs font-medium mt-0.5 text-amber-100 leading-snug">
                  You're offline. Check your internet connection.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissedOffline(true)}
              className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-amber-800 transition-colors pointer-events-auto"
              aria-label="Dismiss offline notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Back Online Success Toast */}
        {!isOffline && showOnlineToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto bg-emerald-900 text-emerald-50 border border-emerald-700/60 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center flex-shrink-0 text-emerald-200">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Connection Restored
                </p>
                <p className="text-xs font-medium text-emerald-100">
                  You're back online.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOnlineToast(false)}
              className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors pointer-events-auto"
              aria-label="Dismiss online notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
