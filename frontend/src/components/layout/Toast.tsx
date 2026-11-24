import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = type === 'success'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md max-w-sm sm:max-w-md ${
        isSuccess
          ? 'bg-success/10 border-success/20 text-success shadow-sm'
          : 'bg-danger/10 border-danger/20 text-danger shadow-sm'
      }`}
    >
      <div className={`p-1 rounded-full ${isSuccess ? 'text-success bg-success/20' : 'text-danger bg-danger/20'}`}>
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 text-xs font-semibold select-none leading-relaxed">
        {message}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
