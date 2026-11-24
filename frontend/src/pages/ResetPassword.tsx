import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import PasswordField from '@/components/auth/PasswordField'
import ValidationMessage from '@/components/auth/ValidationMessage'
import SuccessMessage from '@/components/auth/SuccessMessage'
import { resetPassword, getErrorMessage } from '@/services/authService'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  // Verify that the user came from OTP verification
  const state = location.state as { authorized?: boolean; email?: string; otp?: string } | null
  const isAuthorized = state?.authorized || false
  const email = state?.email || ''
  const otp = state?.otp || ''

  // Form states
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Touched states
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)

  // Errors
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Strict URL Direct Access Guard: Redirect to forgot password if state is missing
  useEffect(() => {
    if (!isAuthorized || !email || !otp) {
      navigate('/forgot-password', { replace: true })
    }
  }, [isAuthorized, email, otp, navigate])

  // Cleanup Axios controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Password rules check
  const rules = {
    length: password.length >= 8,
    hasLowerUpper: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }

  const strengthScore = Object.values(rules).filter(Boolean).length

  const getStrengthLabel = () => {
    if (password.length === 0) return ''
    if (strengthScore <= 1) return 'Weak'
    if (strengthScore <= 3) return 'Medium'
    return 'Strong'
  }

  const getStrengthColor = () => {
    if (strengthScore <= 1) return 'bg-red-500'
    if (strengthScore <= 3) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  // Validation functions
  const validatePassword = (val: string) => {
    if (!val) return 'Password is required'
    if (val.length < 8) return 'Password must be at least 8 characters'
    return ''
  }

  const validateConfirmPassword = (val: string, pass: string) => {
    if (!val) return 'Please confirm your new password'
    if (val !== pass) return 'Passwords do not match'
    return ''
  }

  // Dynamic Validation Effect
  useEffect(() => {
    if (passwordTouched) setPasswordError(validatePassword(password))
  }, [password, passwordTouched])

  useEffect(() => {
    if (confirmPasswordTouched) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, password))
    }
  }, [confirmPassword, password, confirmPasswordTouched])

  // Don't render component UI if state is missing (let the redirect run in useEffect)
  if (!isAuthorized || !email || !otp) {
    return null
  }

  // Form validity
  const isFormValid =
    password.length >= 8 &&
    confirmPassword === password &&
    validatePassword(password) === '' &&
    validateConfirmPassword(confirmPassword, password) === ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prevent duplicate requests
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    setFormError('')

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await resetPassword(email, otp, password, controller.signal)
      
      if (response.data.success) {
        setIsSuccess(true)
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setFormError(response.data.message || 'Failed to reset password. Please try again.')
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
      title="Reset your password"
      subtitle="Choose a strong, secure new password for your account"
    >
      <AuthCard>
        {isSuccess ? (
          <div className="py-2">
            <SuccessMessage
              title="Password Reset Successfully"
              message="Your password has been updated. You will be redirected to the sign in page shortly."
            />
            <div className="mt-6 text-center select-none text-xs text-gray-400 font-semibold" role="status">
              Redirecting to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {formError && <ValidationMessage message={formError} />}

            {/* New Password */}
            <div className="flex flex-col gap-1">
              <PasswordField
                id="password"
                label="New Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                error={passwordError}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />

              {/* Strength meter bar */}
              {password.length > 0 && (
                <div className="flex flex-col gap-1 mt-0.5 select-none">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Password Strength</span>
                    <span className={`font-bold ${
                      strengthScore <= 1 ? 'text-danger' : strengthScore <= 3 ? 'text-warning' : 'text-success'
                    }`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  {/* Bar indicators */}
                  <div className="flex gap-1 h-1 w-full bg-divider rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>
                  {/* Rule checklist */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground mt-0.5">
                    <span className={rules.length ? 'text-success font-bold' : ''}>
                      ✓ Min 8 chars
                    </span>
                    <span className={rules.hasLowerUpper ? 'text-success font-bold' : ''}>
                      ✓ Upper & lower
                    </span>
                    <span className={rules.hasNumber ? 'text-success font-bold' : ''}>
                      ✓ At least 1 number
                    </span>
                    <span className={rules.hasSpecial ? 'text-success font-bold' : ''}>
                      ✓ 1 symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmPasswordTouched(true)}
              error={confirmPasswordError}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
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
                  <span>Resetting password...</span>
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
