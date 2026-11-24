import axios from 'axios'
import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import OTPInput from '@/components/auth/OTPInput'
import ValidationMessage from '@/components/auth/ValidationMessage'
import { verifySignupOtp, verifyResetOtp, forgotPassword, resendOtp, getErrorMessage, useAuth } from '@/services/authService'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useAuth()

  // Get state info passed from previous page
  const state = location.state as { flow?: 'signup' | 'forgot-password'; email?: string; message?: string } | null
  const flow = state?.flow || 'signup'
  const emailAddress = state?.email || ''

  const [otp, setOtp] = useState<string>('')
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Direct access URL guard: redirect to signup/forgot-password if email is missing
  useEffect(() => {
    if (!state || !state.email) {
      navigate(flow === 'forgot-password' ? '/forgot-password' : '/signup', { replace: true })
    }
  }, [state, flow, navigate])

  // Countdown timer effect & cleanup Axios controller on unmount
  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  const startTimer = () => {
    setTimer(60)
    setCanResend(false)
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Prevent rendering if redirected due to missing state
  if (!state || !state.email) {
    return null
  }

  // Check if OTP is completely filled (supports 6 or 7 digits)
  const isOtpComplete = otp.length >= 6 && otp.length <= 7

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prevent duplicate request submission while processing
    if (!isOtpComplete || isVerifying) return

    setIsVerifying(true)
    setError('')

    // Cancel any previous pending requests
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (flow === 'forgot-password') {
        const response = await verifyResetOtp(emailAddress, otp, controller.signal)
        const isSuccess =
          response.data?.success === true ||
          response.data?.status === 'SUCCESS' ||
          (response.status === 200 && response.data?.success !== false && !response.data?.error)

        if (isSuccess) {
          navigate('/reset-password', {
            state: {
              authorized: true,
              email: emailAddress,
              otp: otp,
            },
          })
        } else {
          setError(response.data?.message || 'Invalid or expired OTP. Please try again.')
        }
      } else {
        const response = await verifySignupOtp(emailAddress, otp, controller.signal)
        const isSuccess =
          response.data?.success === true ||
          response.data?.status === 'SUCCESS' ||
          (response.status === 200 && response.data?.success !== false && !response.data?.error)

        if (isSuccess) {
          const successMsg = response.data?.message || 'Email verified successfully. Please sign in.'
          showToast(successMsg, 'success')
          navigate('/login', { state: { email: emailAddress } })
        } else {
          setError(response.data?.message || 'Invalid or expired OTP. Please try again.')
        }
      }
    } catch (err: any) {
      if (axios.isCancel(err)) return
      const errMsg = getErrorMessage(err) || 'Invalid or expired OTP. Please try again.'
      setError(errMsg)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || isResending) return
    setError('')
    setIsResending(true)
    
    // Reset OTP entry
    setOtp('')
    
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      let resendResponse: any
      if (flow === 'forgot-password') {
        resendResponse = await forgotPassword(emailAddress, controller.signal)
      } else {
        resendResponse = await resendOtp(emailAddress, controller.signal)
      }
      const successMsg =
        resendResponse?.data?.message ||
        (typeof resendResponse?.data === 'string' ? resendResponse.data : null) ||
        'New verification code sent successfully.'
      showToast(successMsg, 'success')
      startTimer()
    } catch (err: any) {
      if (axios.isCancel(err)) return
      const errMsg = getErrorMessage(err) || 'Failed to resend verification OTP. Please try again.'
      showToast(errMsg, 'error')
      setError(errMsg)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a verification code to ${emailAddress}`}
    >
      <AuthCard>
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          {state?.message && !error && (
            <div className="p-2.5 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold rounded-xl text-center" role="status">
              {state.message}
            </div>
          )}

          {error && <ValidationMessage message={error} />}

          {/* OTP inputs container */}
          <div className="flex flex-col gap-1 text-center">
            <label id="otp-label" className="text-[13px] font-semibold text-secondary-foreground select-none">
              Enter verification code
            </label>
            <OTPInput
              otp={otp}
              setOtp={setOtp}
              error={!!error}
              disabled={isVerifying}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isOtpComplete || isVerifying}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-secondary-bg disabled:text-muted-foreground text-white font-bold text-sm rounded-lg shadow-sm disabled:shadow-none transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed cursor-pointer border border-transparent disabled:border-border"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Verifying...</span>
              </>
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Resend text timer */}
          <div className="text-center text-xs font-semibold text-muted-foreground select-none mt-0.5">
            Didn't receive the code?{' '}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 font-bold text-primary hover:text-primary-hover disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors focus:outline-none cursor-pointer"
              >
                {isResending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Resend Code'
                )}
              </button>
            ) : (
              <span className="text-muted-foreground">
                Resend code in <strong className="font-bold text-secondary-foreground">{timer}s</strong>
              </span>
            )}
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
