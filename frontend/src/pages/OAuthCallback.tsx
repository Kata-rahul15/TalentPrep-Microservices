import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/services/authService'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const { user, getProfile, loading } = useAuth()
  const hasRequestedRef = useRef(false)

  useEffect(() => {
    // Clear pending sessionStorage flag immediately to prevent repeat triggers
    sessionStorage.removeItem('oauth_pending')

    console.log(`[OAuthCallback] Evaluating OAuth return state. loading=${loading}, user=${user ? user.email || user.username : 'null'}`)

    if (loading) {
      // AuthProvider session check is currently running, wait for it to settle
      return
    }

    if (user) {
      console.log('[OAuthCallback] Active user session confirmed. Navigating to /home...')
      navigate('/home', { replace: true })
      return
    }

    if (hasRequestedRef.current) return
    hasRequestedRef.current = true

    const processOAuth = async () => {
      try {
        console.log('[OAuthCallback] Explicitly calling getProfile() after OAuth return...')
        const profile = await getProfile()
        console.log('[OAuthCallback] getProfile() succeeded for:', profile.email || profile.username)
        navigate('/home', { replace: true })
      } catch (err: any) {
        console.error('[OAuthCallback] Failed to fetch profile after OAuth:', err?.message || err)
        navigate('/login', { replace: true })
      }
    }

    processOAuth()
  }, [user, loading, getProfile, navigate])

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-sm text-center flex flex-col items-center gap-6">
        {/* Centered Loading Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h2 className="font-heading font-extrabold text-xl text-foreground tracking-tight">
            Signing you in...
          </h2>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
            Please wait while we securely complete your authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
