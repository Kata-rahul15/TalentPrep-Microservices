import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import InputField from '@/components/auth/InputField'
import PasswordField from '@/components/auth/PasswordField'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'
import ValidationMessage from '@/components/auth/ValidationMessage'
import axios from 'axios'
import { useAuth, getErrorMessage, resendOtp } from '@/services/authService'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, showToast } = useAuth()
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Touched state for validation display
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Error messages
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Handle OAuth cancellation or failure query parameters
  useEffect(() => {
    const oauthStatus = searchParams.get('oauth')
    const errorStatus = searchParams.get('error')

    if (oauthStatus === 'cancelled' || errorStatus === 'oauth') {
      sessionStorage.removeItem('oauth_pending')

      if (oauthStatus === 'cancelled') {
        setFormError('Google sign-in was cancelled. Please try again.')
      } else {
        setFormError('Google authentication failed. Please try again.')
      }

      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate])

  // Validate email format
  const validateEmailStr = (val: string) => {
    if (!val) return 'Email address is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) return 'Please enter a valid email address'
    return ''
  }

  // Validate password
  const validatePasswordStr = (val: string) => {
    if (!val) return 'Password is required'
    if (val.length < 8) return 'Password must be at least 8 characters'
    return ''
  }

  // Handle validation checks
  useEffect(() => {
    if (emailTouched) {
      setEmailError(validateEmailStr(email))
    }
  }, [email, emailTouched])

  useEffect(() => {
    if (passwordTouched) {
      setPasswordError(validatePasswordStr(password))
    }
  }, [password, passwordTouched])

  // Cleanup Axios controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Form validity check
  const isFormValid = 
    email.length > 0 && 
    password.length >= 8 && 
    validateEmailStr(email) === '' && 
    validatePasswordStr(password) === ''

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
      await login({ type: 'local', email, password, signal: controller.signal })
      navigate('/home')
    } catch (error: any) {
      if (axios.isCancel(error)) return

      const responseData = error?.response?.data
      const isUnverified =
        responseData?.errorCode === 'ACCOUNT_NOT_VERIFIED' ||
        responseData?.isAccountVerified === false ||
        responseData?.status === 'UNVERIFIED' ||
        (error?.response?.status === 403 &&
          (responseData?.message === 'Account not verified' ||
            (typeof responseData?.message === 'string' &&
              responseData.message.toLowerCase().includes('not verified')) ||
            responseData === 'Account not verified'))

      if (isUnverified) {
        const unverifiedEmail = responseData?.email || email
        try {
          const resendResponse = await resendOtp(unverifiedEmail, controller.signal)
          const msg =
            resendResponse?.data?.message ||
            (typeof responseData?.message === 'string' ? responseData.message : null) ||
            'Account is not verified. A new verification OTP has been sent to your email.'

          showToast(msg, 'success')
          navigate('/verify-otp', {
            state: {
              flow: 'login',
              email: unverifiedEmail,
              message: msg,
            },
          })
        } catch (resendErr: any) {
          if (axios.isCancel(resendErr)) return
          const errorMsg = getErrorMessage(resendErr) || 'Failed to resend verification OTP. Please try again.'
          showToast(errorMsg, 'error')
          setFormError(errorMsg)
        }
        return
      }

      const errMsg = getErrorMessage(error)
      if (errMsg) setFormError(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialSuccess = (_provider: string) => {
    // Redirection after mock oauth
    navigate('/home')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue your career journey"
    >
      <AuthCard>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          {formError && <ValidationMessage message={formError} />}

          {/* Email field */}
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

          {/* Password field */}
          <div className="flex flex-col gap-1">
            <PasswordField
              id="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              error={passwordError}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs select-none">
            <label className="flex items-center gap-2 font-semibold text-secondary-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                disabled={isSubmitting}
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-secondary-bg disabled:text-muted-foreground text-white font-bold text-sm rounded-lg shadow-sm disabled:shadow-none transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed cursor-pointer border border-transparent disabled:border-border"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Social login divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-divider" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground font-semibold uppercase tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social buttons */}
          <SocialLoginButtons onSuccess={handleSocialSuccess} />

          {/* Signup link */}
          <p className="mt-1 text-center text-xs font-semibold text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-bold text-primary hover:text-primary-hover transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
