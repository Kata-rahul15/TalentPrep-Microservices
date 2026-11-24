import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import InputField from '@/components/auth/InputField'
import ValidationMessage from '@/components/auth/ValidationMessage'
import { forgotPassword, getErrorMessage } from '@/services/authService'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) return 'Please enter a valid email address'
    return ''
  }

  useEffect(() => {
    if (emailTouched) {
      setEmailError(validateEmail(email))
    }
  }, [email, emailTouched])

  // Cleanup Axios controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const isFormValid = email.length > 0 && validateEmail(email) === ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prevent duplicate request submission while processing
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    setFormError('')

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await forgotPassword(email, controller.signal)
      if (response.data.success) {
        navigate('/verify-otp', { state: { flow: 'forgot-password', email } })
      } else {
        setFormError(response.data.message || 'Failed to send reset OTP. Please try again.')
      }
    } catch (error: any) {
      const errMsg = getErrorMessage(error)
      if (errMsg) setFormError(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email address and we'll send you a code to reset your password"
    >
      <AuthCard>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {formError && <ValidationMessage message={formError} />}

          {/* Email */}
          <InputField
            id="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            error={emailError}
            required
            disabled={isSubmitting}
            autoComplete="email"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#CDF22B] hover:bg-[#BCE01E] disabled:bg-[#F2EFE9] dark:disabled:bg-[#1A1C18] disabled:text-[#383B36]/60 dark:disabled:text-[#BDB9AF]/60 text-[#080908] font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition-colors duration-150 disabled:cursor-not-allowed cursor-pointer border border-transparent disabled:border-[#E5E0D5] dark:disabled:border-[#232621]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#080908] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Sending code...</span>
              </>
            ) : (
              'Send code'
            )}
          </button>

          {/* Back to Login link */}
          <p className="mt-1 text-center text-xs text-[#2C2E2B] dark:text-[#E2DFD7]">
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-bold text-[#080908] dark:text-[#FAF8F3] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
