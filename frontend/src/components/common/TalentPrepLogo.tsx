import { cn } from '@/lib/utils'

interface TalentPrepLogoProps {
  className?: string
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function TalentPrepIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full h-full', className)}
    >
      <defs>
        <linearGradient id="tp-grad-top" x1="4" y1="4" x2="28" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="tp-grad-mid" x1="4" y1="12" x2="28" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="tp-grad-bot" x1="4" y1="20" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      
      {/* Top Layer */}
      <path
        d="M16 3L4 9L16 15L28 9L16 3Z"
        fill="url(#tp-grad-top)"
      />
      {/* Middle Layer */}
      <path
        d="M4 14L16 20L28 14L25 12.5L16 17L7 12.5L4 14Z"
        fill="url(#tp-grad-mid)"
      />
      {/* Bottom Layer */}
      <path
        d="M4 21L16 27L28 21L25 19.5L16 24L7 19.5L4 21Z"
        fill="url(#tp-grad-bot)"
      />
    </svg>
  )
}

export default function TalentPrepLogo({
  className,
  iconOnly = false,
  size = 'md',
}: TalentPrepLogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-sm' },
    md: { icon: 'w-7.5 h-7.5', text: 'text-lg' },
    lg: { icon: 'w-9 h-9', text: 'text-xl' },
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className={cn('flex-shrink-0 flex items-center justify-center', sizeClasses[size].icon)}>
        <TalentPrepIcon />
      </div>
      {!iconOnly && (
        <span
          className={cn(
            'font-heading font-extrabold tracking-tight text-slate-900 dark:text-white',
            sizeClasses[size].text
          )}
        >
          TalentPrep
        </span>
      )}
    </div>
  )
}
