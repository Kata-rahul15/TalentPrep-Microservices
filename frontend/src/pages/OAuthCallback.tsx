import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/services/authService'
import { TalentPrepIcon } from '@/components/common/TalentPrepLogo'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const { user, getProfile, loading } = useAuth()
  const hasRequestedRef = useRef(false)

  useEffect(() => {
    sessionStorage.removeItem('oauth_pending')

    if (loading) return

    if (user) {
      navigate('/home', { replace: true })
      return
    }

    if (hasRequestedRef.current) return
    hasRequestedRef.current = true

    const processOAuth = async () => {
      try {
        await getProfile()
        navigate('/home', { replace: true })
      } catch (err: any) {
        console.error('[OAuthCallback] Failed to fetch profile after OAuth:', err?.message || err)
        navigate('/login', { replace: true })
      }
    }

    processOAuth()
  }, [user, loading, getProfile, navigate])

  return (
    <div className="min-h-screen w-full bg-[#FAF8F3] dark:bg-[#080908] flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-8 shadow-sm text-center flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-3 border-[#E5E0D5] dark:border-[#232621] border-t-[#080908] dark:border-t-[#CDF22B] rounded-full animate-spin" />
          <div className="absolute w-7 h-7 flex items-center justify-center">
            <TalentPrepIcon />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="font-heading font-bold text-lg text-[#080908] dark:text-[#FAF8F3] tracking-tight">
            Signing you in
          </h1>
          <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
