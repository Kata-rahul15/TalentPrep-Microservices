import { cn } from '@/lib/utils'

interface SkillBadgeProps {
  label: string
  variant?: 'default' | 'matched' | 'missing' | 'primary' | 'muted'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles = {
  default: 'bg-secondary-bg text-secondary-foreground border-border',
  matched: 'bg-success/10 text-success border-success/20',
  missing: 'bg-danger/10 text-danger border-danger/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  muted: 'bg-secondary-bg/50 text-muted-foreground border-border',
}

const sizeStyles = {
  sm: 'px-1.5 py-0.2 text-[10px] leading-tight',
  md: 'px-2 py-0.5 text-[11px] leading-snug',
}

export default function SkillBadge({ label, variant = 'default', size = 'md', className }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {label}
    </span>
  )
}
