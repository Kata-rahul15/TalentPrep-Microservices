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
        className="pr-10"
        {...props}
      />
      <button
        type="button"
        onClick={toggleVisibility}
        disabled={props.disabled}
        tabIndex={0}
        className="absolute right-2.5 top-[29px] p-1 text-[#383B36] hover:text-[#080908] dark:text-[#BDB9AF] dark:hover:text-[#FAF8F3] focus:outline-none transition-colors rounded cursor-pointer"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
