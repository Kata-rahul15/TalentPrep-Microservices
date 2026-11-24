import React from 'react'
import { cn } from '@/lib/utils'

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = 'Loading...', className }: PageLoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
      <div className="w-8 h-8 rounded-full border-3 border-[#E5E0D5] dark:border-[#232621] border-t-[#080908] dark:border-t-[#CDF22B] animate-spin" />
      <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] font-medium">{message}</p>
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
      <div className="w-9 h-9 rounded-md bg-[#FEE2E2] dark:bg-rose-950/40 text-[#DC2626] flex items-center justify-center font-bold text-sm">
        <span>!</span>
      </div>
      <div>
        <p className="font-heading font-bold text-sm text-[#080908] dark:text-[#FAF8F3] mb-0.5">Failed to load</p>
        <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3.5 py-1.5 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          Try again
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
        <div className="w-10 h-10 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <p className="font-heading font-bold text-sm text-[#080908] dark:text-[#FAF8F3] mb-0.5">{title}</p>
        {description && <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] max-w-xs">{description}</p>}
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
  primary: 'bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold shadow-2xs',
  secondary: 'bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] hover:bg-[#FAF8F3] dark:hover:bg-[#1A1C18] text-[#080908] dark:text-[#FAF8F3] font-semibold',
  ghost: 'hover:bg-[#FAF8F3] dark:hover:bg-[#181A16] text-[#2C2E2B] dark:text-[#E2DFD7]',
  danger: 'bg-[#FEE2E2] hover:bg-red-200 dark:bg-rose-950/40 text-[#DC2626] border border-[#FCA5A5]/60 font-semibold',
}

const buttonSizes = {
  sm: 'px-2.5 py-1 text-xs rounded-md h-7.5',
  md: 'px-3.5 py-1.5 text-xs rounded-lg h-8.5',
  lg: 'px-4.5 py-2 text-xs sm:text-sm rounded-lg h-10',
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
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      {children}
    </button>
  )
}

export function Badge({
  variant = 'default',
  children,
  className,
}: {
  variant?: 'default' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
  className?: string
}) {
  const styles = {
    default: 'bg-[#FAF8F3] dark:bg-[#181A16] text-[#080908] dark:text-[#FAF8F3] border-[#E5E0D5] dark:border-[#232621]',
    success: 'bg-[#080908] text-[#CDF22B] border-[#232621]',
    warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
