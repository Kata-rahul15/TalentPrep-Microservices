import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import InputField from './InputField'

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string
  label: string
  error?: string
  helperText?: string
}

export default function PasswordField({ id, label, error, helperText, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="relative">
      <InputField
        id={id}
        label={label}
        type={showPassword ? 'text' : 'password'}
        error={error}
        helperText={helperText}
        className="pr-12"
        {...props}
      />
      <button
        type="button"
        onClick={toggleVisibility}
        disabled={props.disabled}
        tabIndex={0}
        className="absolute right-3 top-[27px] p-1 text-muted-foreground hover:text-foreground focus:text-primary focus:outline-none transition-colors rounded-lg"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
      </button>
    </div>
  )
}
