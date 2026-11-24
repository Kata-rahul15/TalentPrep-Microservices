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
    // Allow only numeric digits
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
        className={`w-full max-w-[280px] h-13 text-center text-2xl font-bold tracking-[0.3em] bg-card border rounded-xl outline-none transition-all duration-200 select-text placeholder:tracking-[0.1em] placeholder:text-muted-foreground
          ${error
            ? 'border-danger/50 focus:border-danger focus:ring-2 focus:ring-danger/20 text-danger'
            : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground'
          }
          ${disabled ? 'bg-secondary-bg text-muted-foreground border-border cursor-not-allowed' : ''}
        `}
        aria-label="One-Time Password Input"
      />
    </div>
  )
}
