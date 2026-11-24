import { cn } from '@/lib/utils'

interface TalentPrepLogoProps {
  className?: string
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  inverted?: boolean
}

export function TalentPrepIcon({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full h-full', className)}
    >
      {/* Precision geometric architectural mark */}
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="6"
        fill={inverted ? '#FAF8F3' : '#080908'}
      />
      {/* Inner angled preparation dynamic chevron */}
      <path
        d="M10 22L16 10L22 22"
        stroke={inverted ? '#080908' : '#FAF8F3'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Neon Lime Accent pip: precision focal moment */}
      <circle
        cx="16"
        cy="15"
        r="2.5"
        fill="#CDF22B"
      />
    </svg>
  )
}

export default function TalentPrepLogo({
  className,
  iconOnly = false,
  size = 'md',
  inverted = false,
}: TalentPrepLogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-sm' },
    md: { icon: 'w-7.5 h-7.5', text: 'text-lg' },
    lg: { icon: 'w-9 h-9', text: 'text-xl' },
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className={cn('flex-shrink-0 flex items-center justify-center', sizeClasses[size].icon)}>
        <TalentPrepIcon inverted={inverted} />
      </div>
      {!iconOnly && (
        <span
          className={cn(
            'font-heading font-black tracking-tight',
            inverted ? 'text-[#FAF8F3]' : 'text-[#080908] dark:text-[#FAF8F3]',
            sizeClasses[size].text
          )}
        >
          Talent<span className="text-[#080908] dark:text-[#FAF8F3]">Prep</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#CDF22B] ml-1 mb-0.5" />
        </span>
      )}
    </div>
  )
}
