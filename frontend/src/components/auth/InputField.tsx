import React from 'react'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  helperText?: string
}

export default function InputField({
  id,
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputFieldProps) {
  const hasError = !!error
  
  return (
    <div className="w-full flex flex-col gap-0.5 text-left">
      <label htmlFor={id} className="text-[13px] font-semibold text-secondary-foreground select-none">
        {label}
        {props.required && <span className="text-danger ml-1 font-normal">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          className={`w-full px-3 py-1.5 bg-card text-foreground border border-border text-sm rounded-lg outline-none transition-all duration-200 select-text placeholder:text-muted-foreground
            ${hasError
              ? 'border-danger/50 focus:border-danger focus:ring-2 focus:ring-danger/20'
              : 'focus:border-primary focus:ring-2 focus:ring-primary/20'
            }
            ${props.disabled ? 'bg-secondary-bg text-muted-foreground border-border cursor-not-allowed' : ''}
            ${className}`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${id}-error` : (helperText ? `${id}-helper` : undefined)}
          {...props}
        />
      </div>

      {hasError ? (
        <span id={`${id}-error`} className="text-xs font-semibold text-danger mt-0.5" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${id}-helper`} className="text-xs text-muted-foreground mt-0.5">
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
