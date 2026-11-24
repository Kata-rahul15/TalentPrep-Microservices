import React from 'react'
import { cn } from '@/lib/utils'

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = 'Loading...', className }: PageLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
      <div className="w-8 h-8 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
      <p className="text-xs sm:text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  )
}

interface PageErrorProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function PageError({ message = 'Something went wrong.', onRetry, className }: PageErrorProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 gap-3 text-center', className)}>
      <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center font-bold">
        <span>!</span>
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground mb-0.5">Failed to load</p>
        <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 gap-3 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-secondary-bg/50 text-muted-foreground flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <p className="font-heading font-semibold text-sm text-foreground mb-0.5">{title}</p>
        {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const buttonVariants = {
  primary: 'bg-primary hover:bg-primary-hover text-white shadow-2xs',
  secondary: 'bg-card border border-border hover:bg-secondary-bg text-foreground',
  ghost: 'hover:bg-secondary-bg text-secondary-foreground',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20',
}

const buttonSizes = {
  sm: 'px-2.5 py-1 text-xs rounded-lg h-7.5',
  md: 'px-3.5 py-1.5 text-xs sm:text-[13px] rounded-lg h-8.5',
  lg: 'px-4.5 py-2 text-sm rounded-xl h-10',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]',
        buttonVariants[variant],
        buttonSizes[size],
        'disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border-border disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 disabled:opacity-80',
        className
      )}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : null}
      {children}
    </button>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-3.5 sm:p-4 flex items-center gap-3', className)}>
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="text-[11px] text-muted-foreground font-medium mb-0.5 leading-tight">{label}</p>
        <p className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight">{value}</p>
      </div>
    </div>
  )
}
