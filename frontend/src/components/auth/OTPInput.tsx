import React from 'react'

interface OTPInputProps {
  otp: string
  setOtp: (value: string) => void
  error?: boolean
  disabled?: boolean
}

export default function OTPInput({ otp, setOtp, error, disabled }: OTPInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericValue = value.replace(/\D/g, '')
    setOtp(numericValue)
  }

  return (
    <div className="flex justify-center w-full" dir="ltr">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={7}
        disabled={disabled}
        value={otp}
        onChange={handleChange}
        placeholder="••••••"
        className={`w-full max-w-[280px] h-12 text-center text-xl font-mono font-bold tracking-[0.25em] bg-[#FFFFFF] dark:bg-[#181A16] border rounded-lg outline-none transition-colors duration-150 placeholder:text-[#080908]/50 dark:placeholder:text-[#FAF8F3]/50
          ${error
            ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] text-[#DC2626]'
            : 'border-[#E5E0D5] dark:border-[#232621] focus:border-[#080908] dark:focus:border-[#CDF22B] focus:ring-1 focus:ring-[#080908] dark:focus:ring-[#CDF22B] text-[#080908] dark:text-[#FAF8F3]'
          }
          ${disabled ? 'bg-[#F2EFE9] dark:bg-[#1A1C18] text-[#383B36]/60 dark:text-[#BDB9AF]/60 cursor-not-allowed' : ''}
        `}
        aria-label="One-Time Password Input"
      />
    </div>
  )
}
