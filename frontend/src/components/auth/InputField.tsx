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
    <div className="w-full flex flex-col gap-1 text-left">
      <label htmlFor={id} className="text-xs font-semibold text-[#2C2E2B] dark:text-[#E2DFD7] select-none">
        {label}
        {props.required && <span className="text-[#DC2626] ml-1 font-normal">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          className={`w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#181A16] text-[#080908] dark:text-[#FAF8F3] border border-[#E5E0D5] dark:border-[#232621] text-xs sm:text-sm rounded-lg outline-none transition-colors duration-150 placeholder:text-[#080908]/50 dark:placeholder:text-[#FAF8F3]/50 caret-[#080908] dark:caret-[#CDF22B]
            ${hasError
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]'
              : 'focus:border-[#080908] dark:focus:border-[#CDF22B] focus:ring-1 focus:ring-[#080908] dark:focus:ring-[#CDF22B]'
            }
            ${props.disabled ? 'bg-[#F2EFE9] dark:bg-[#1A1C18] text-[#383B36] dark:text-[#BDB9AF] cursor-not-allowed' : ''}
            ${className}`}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${id}-error` : (helperText ? `${id}-helper` : undefined)}
          {...props}
        />
      </div>

      {hasError ? (
        <span id={`${id}-error`} className="text-[11px] font-medium text-[#DC2626] mt-0.5" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${id}-helper`} className="text-[11px] text-[#383B36] dark:text-[#BDB9AF] mt-0.5">
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
