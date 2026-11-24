import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface ValidationMessageProps {
  message: string
  type?: 'error' | 'warning' | 'info'
}

export default function ValidationMessage({ message, type = 'error' }: ValidationMessageProps) {
  if (!message) return null

  const bgColors = {
    error: 'bg-danger/10 border-danger/20 text-danger',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    info: 'bg-info/10 border-info/20 text-info',
  }

  const iconColors = {
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-start gap-2 p-3 border text-xs font-semibold rounded-xl ${bgColors[type]}`}
      role="alert"
    >
      <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
      <span>{message}</span>
    </motion.div>
  )
}
