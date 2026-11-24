import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface SuccessMessageProps {
  title: string
  message: string
}

export default function SuccessMessage({ title, message }: SuccessMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center p-6 bg-success/10 border border-success/20 rounded-2xl"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success mb-4"
      >
        <CheckCircle2 className="w-7 h-7" />
      </motion.div>
      <h3 className="font-heading font-extrabold text-lg text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-secondary-foreground leading-relaxed max-w-xs">
        {message}
      </p>
    </motion.div>
  )
}
