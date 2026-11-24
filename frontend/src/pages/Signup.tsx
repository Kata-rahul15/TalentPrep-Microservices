import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import InputField from '@/components/auth/InputField'
import PasswordField from '@/components/auth/PasswordField'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'
import ValidationMessage from '@/components/auth/ValidationMessage'
import LegalConsentModal from '@/components/auth/LegalConsentModal'
import { registerUser, getErrorMessage } from '@/services/authService'

export default function Signup() {
  const navigate = useNavigate()

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false)

  // Touched states
  const [nameTouched, setNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)

  // Errors
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Password strength checklist rules
  const rules = {
    length: password.length >= 8,
    hasLowerUpper: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }

  // Calculate strength score (0 to 4)
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
  const validateName = (val: string) => {
    if (!val.trim()) return 'Full name is required'
    if (val.trim().length < 2) return 'Name must be at least 2 characters'
    return ''
  }

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) return 'Please enter a valid email address'
    return ''
  }

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required'
    if (val.length < 8) return 'Password must be at least 8 characters'
    return ''
  }

  const validateConfirmPassword = (val: string, pass: string) => {
    if (!val) return 'Please confirm your password'
    if (val !== pass) return 'Passwords do not match'
    return ''
  }

  // Dynamic Validation Effect
  useEffect(() => {
    if (nameTouched) setNameError(validateName(name))
  }, [name, nameTouched])

  useEffect(() => {
    if (emailTouched) setEmailError(validateEmail(email))
  }, [email, emailTouched])

  useEffect(() => {
    if (passwordTouched) setPasswordError(validatePassword(password))
  }, [password, passwordTouched])

  useEffect(() => {
    if (confirmPasswordTouched) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, password))
    }
  }, [confirmPassword, password, confirmPasswordTouched])

  // Cleanup Axios controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Form validity
  const isFormValid =
    name.trim().length >= 2 &&
    email.length > 0 &&
    password.length >= 8 &&
    confirmPassword === password &&
    agreeTerms &&
    validateName(name) === '' &&
    validateEmail(email) === '' &&
    validatePassword(password) === '' &&
    validateConfirmPassword(confirmPassword, password) === ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      setFormError('You must agree to the Terms & Conditions and Privacy Policy to create an account.')
      setIsLegalModalOpen(true)
      return
    }

    // Prevent duplicate request submission while processing
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await registerUser(
        name,
        email,
        password,
        controller.signal
      );

      const successMessage =
        response?.data?.message ||
        (typeof response?.data === 'string' ? response.data : null) ||
        'Verification OTP sent to your email.'

      navigate("/verify-otp", {
        state: {
          flow: "signup",
          email,
          message: successMessage,
        }
      });

    } catch (error: any) {
      if (axios.isCancel(error)) return

      const responseData = error?.response?.data

      // Check backend error/status fields indicating an existing unverified account
      const isUnverified =
        responseData?.errorCode === 'ACCOUNT_NOT_VERIFIED' ||
        responseData?.isAccountVerified === false ||
        responseData?.status === 'UNVERIFIED' ||
        (typeof responseData?.message === 'string' &&
          responseData.message.toLowerCase().includes('not verified'))

      if (isUnverified) {
        const unverifiedMessage =
          responseData?.message ||
          'Account already exists but is not verified. A new OTP has been sent.'

        navigate("/verify-otp", {
          state: {
            flow: "signup",
            email,
            message: unverifiedMessage,
          }
        });
        return
      }

      // Existing verified account or standard error: stay on Signup page with inline error
      const errMsg = getErrorMessage(error) || 'Registration failed. Please check your details and try again.'
      setFormError(errMsg)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSuccess = (_provider: string) => {
    navigate('/home')
  }

  const handleOpenLegalModal = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLegalModalOpen(true)
  }

  return (
    <>
      <AuthLayout
        title="Create account"
        subtitle="Start your AI-powered career journey and job discovery"
      >
        <AuthCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {formError && <ValidationMessage message={formError} />}

            {/* Full Name */}
            <InputField
              id="name"
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              error={nameError}
              required
              disabled={isSubmitting}
              autoComplete="name"
            />

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

            {/* Password */}
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
                autoComplete="new-password"
              />

              {/* Strength meter bar */}
              {password.length > 0 && (
                <div className="flex flex-col gap-1 mt-0.5 select-none">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500">
                    <span>Password Strength</span>
                    <span className={`font-bold ${
                      strengthScore <= 1 ? 'text-red-500' : strengthScore <= 3 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  {/* Bar indicators */}
                  <div className="flex gap-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>
                  {/* Rule checklist */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-gray-400 mt-0.5">
                    <span className={rules.length ? 'text-emerald-600 font-bold' : ''}>
                      ✓ Min 8 chars
                    </span>
                    <span className={rules.hasLowerUpper ? 'text-emerald-600 font-bold' : ''}>
                      ✓ Upper & lower
                    </span>
                    <span className={rules.hasNumber ? 'text-emerald-600 font-bold' : ''}>
                      ✓ At least 1 number
                    </span>
                    <span className={rules.hasSpecial ? 'text-emerald-600 font-bold' : ''}>
                      ✓ 1 symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmPasswordTouched(true)}
              error={confirmPasswordError}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
            />

            {/* Terms & Conditions Consent Checkbox */}
            <div className="flex items-start gap-2.5 text-xs select-none py-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => {
                  e.preventDefault()
                  setIsLegalModalOpen(true)
                }}
                onClick={(e) => {
                  e.preventDefault()
                  setIsLegalModalOpen(true)
                }}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                disabled={isSubmitting}
              />
              <label htmlFor="agreeTerms" className="font-semibold text-secondary-foreground leading-normal cursor-pointer">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={handleOpenLegalModal}
                  className="font-bold text-primary hover:text-primary-hover transition-colors underline cursor-pointer inline"
                >
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={handleOpenLegalModal}
                  className="font-bold text-primary hover:text-primary-hover transition-colors underline cursor-pointer inline"
                >
                  Privacy Policy
                </button>
                .
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-secondary-bg disabled:text-muted-foreground text-white font-bold text-sm rounded-lg shadow-sm disabled:shadow-none transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed cursor-pointer border border-transparent disabled:border-border"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-divider" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground font-semibold uppercase tracking-wider">
                  Or sign up with
                </span>
              </div>
            </div>

            <SocialLoginButtons onSuccess={handleSocialSuccess} />

            {/* Login link */}
            <p className="mt-1 text-center text-xs font-semibold text-muted-foreground">
              Already have an account?{' '}
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

      {/* Mandatory Single Scrollable Legal Consent Modal */}
      <LegalConsentModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        onConfirmConsent={() => {
          setAgreeTerms(true)
          setFormError('')
        }}
        initialConsentState={agreeTerms}
      />
    </>
  )
}
