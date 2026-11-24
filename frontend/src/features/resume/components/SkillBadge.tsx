import { cn } from '@/lib/utils'

interface SkillBadgeProps {
  label: string
  variant?: 'default' | 'matched' | 'missing' | 'primary' | 'muted'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles = {
  default: 'bg-[#FAF8F3] dark:bg-[#181A16] text-[#080908] dark:text-[#FAF8F3] border-[#E5E0D5] dark:border-[#232621]',
  matched: 'bg-[#080908] text-[#CDF22B] border-[#232621]',
  missing: 'bg-[#FEE2E2] dark:bg-rose-950/30 text-[#DC2626] border-[#FCA5A5]/60',
  primary: 'bg-[#CDF22B] text-[#080908] border-[#BCE01E] font-bold',
  muted: 'bg-[#F2EFE9] dark:bg-[#1A1C18] text-[#383B36] dark:text-[#BDB9AF] border-[#E5E0D5] dark:border-[#232621]',
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px] font-mono leading-tight',
  md: 'px-2 py-0.5 text-[11px] font-mono leading-snug',
}

export default function SkillBadge({ label, variant = 'default', size = 'md', className }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium transition-colors select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {label}
    </span>
  )
}
