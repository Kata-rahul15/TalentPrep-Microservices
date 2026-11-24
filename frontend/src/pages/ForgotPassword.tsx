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
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-secondary-bg disabled:text-muted-foreground text-white font-bold text-sm rounded-lg shadow-sm disabled:shadow-none transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed cursor-pointer border border-transparent disabled:border-border"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Sending code...</span>
              </>
            ) : (
              'Send Code'
            )}
          </button>

          {/* Back to Login link */}
          <p className="mt-1 text-center text-xs font-semibold text-muted-foreground">
            Remember your password?{' '}
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
