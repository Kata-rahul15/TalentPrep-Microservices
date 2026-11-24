import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AnimatePresence } from 'framer-motion'
import Toast from '@/components/layout/Toast'
import NetworkStatusToast from '@/components/layout/NetworkStatusToast'
import { api, getErrorMessage, refreshAuthSession } from '@/api/apiClient'
import { csrfManager } from '@/api/csrfManager'

// Re-export shared API client and error helper for backward compatibility
export { api, getErrorMessage, refreshAuthSession }

// DTO and Profile Interfaces
export interface UserProfile {
  username: string
  userId?: string | number | null
  email: string
  role?: string | null
  isAccountVerified?: boolean | null
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'service_unavailable'

export type LoginOptions =
  | { type: 'local'; email?: string; password?: string; signal?: AbortSignal }
  | { type: 'oauth'; provider?: string; signal?: AbortSignal }

interface AuthContextType {
  user: UserProfile | null
  authStatus: AuthStatus
  authError: string | null
  loginState: (profile: UserProfile) => void
  login: (
    optionsOrEmail: string | LoginOptions,
    passwordParam?: string,
    signalParam?: AbortSignal
  ) => Promise<UserProfile | void>
  logout: () => Promise<void>
  loading: boolean
  getProfile: (signal?: AbortSignal) => Promise<UserProfile>
  fetchProfile: (signal?: AbortSignal) => Promise<UserProfile>
  retrySessionCheck: () => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isTemporaryServiceUnavailable(error: any): boolean {
  const status = error?.response?.status
  if (status === 502 || status === 503 || status === 504) {
    return true
  }
  if (!error?.response && (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK')) {
    return true
  }
  return false
}

function clearUserCachedData(): void {
  // Remove any legacy user metadata key if it existed from prior builds
  try {
    localStorage.removeItem('tf_user')
    localStorage.removeItem('talentprep_selected_resume_id')
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('talentprep_resume_builder_draft_')) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // Ignore storage access errors
  }

  try {
    sessionStorage.removeItem('oauth_pending')
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith('tp_interview_draft_')) {
        sessionKeysToRemove.push(k)
      }
    }
    sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // Ignore storage access errors
  }
}

function normalizeProfileResponse(
  data: any,
  fallback?: Partial<UserProfile>
): UserProfile {
  return {
    username: data?.username || fallback?.username || '',
    userId: data?.userId ?? fallback?.userId ?? null,
    email: data?.email || fallback?.email || '',
    role: data?.role ?? fallback?.role ?? null,
    isAccountVerified:
      data?.isAccountVerified !== undefined && data?.isAccountVerified !== null
        ? data.isAccountVerified
        : fallback?.isAccountVerified ?? true,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const authInitialized = useRef(false)
  const userRef = useRef<UserProfile | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    userRef.current = user
  }, [user])

  // Fetch profile via getProfile() endpoint (used for OAuth flow, login verification & session restoration)
  const getProfile = useCallback(async (signal?: AbortSignal): Promise<UserProfile> => {
    const response = await getUserProfile(signal)
    const profile = normalizeProfileResponse(response.data)
    setUser(profile)
    setAuthStatus('authenticated')
    setAuthError(null)
    return profile
  }, [])

  const fetchProfile = getProfile

  const restoreSession = useCallback(async () => {
    setLoading(true)
    setAuthStatus('loading')
    setAuthError(null)

    try {
      // Remove any legacy cached user state so protected routes never rely on stale localStorage
      try {
        localStorage.removeItem('tf_user')
      } catch {
        // Ignore storage errors
      }

      // Initialize CSRF token in memory early (non-blocking if Gateway is cold)
      csrfManager.getToken().catch(() => {
        // Handled lazily on first unsafe request if needed
      })

      // Verify active HttpOnly cookie session with backend (interceptor handles 401 -> /refresh once)
      const profile = await getProfile()
      setUser(profile)
      setAuthStatus('authenticated')
    } catch (err: any) {
      if (axios.isCancel(err)) {
        return
      }

      if (isTemporaryServiceUnavailable(err)) {
        // Do NOT treat a temporary 503/network outage as proof the user is logged out
        setAuthStatus('service_unavailable')
        setAuthError(getErrorMessage(err))
      } else {
        setUser(null)
        setAuthStatus('unauthenticated')
        setAuthError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [getProfile])

  // Initialize authentication state once on mount
  useEffect(() => {
    if (authInitialized.current) {
      return
    }
    authInitialized.current = true
    restoreSession()
  }, [restoreSession])

  // Listen to unauthorized interceptor event (fired when session/refresh is invalid or revoked)
  useEffect(() => {
    const handleUnauthorized = () => {
      const hadUser = Boolean(userRef.current)
      setUser(null)
      setAuthStatus('unauthenticated')
      setAuthError(null)
      queryClient.clear()
      clearUserCachedData()

      if (hadUser) {
        csrfManager.clearToken()
        setToast({ message: 'Your session has expired. Please log in again.', type: 'error' })
        navigate('/login', { replace: true })
      }
    }

    window.addEventListener('auth-unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized)
    }
  }, [navigate, queryClient])

  const loginState = useCallback((profile: UserProfile) => {
    const normalized = normalizeProfileResponse(profile)
    setUser(normalized)
    setAuthStatus('authenticated')
    setAuthError(null)
  }, [])

  // Unified login method: handles LOCAL vs OAuth login flows
  const login = async (
    optionsOrEmail: string | LoginOptions,
    passwordParam?: string,
    signalParam?: AbortSignal
  ) => {
    if (typeof optionsOrEmail === 'object' && optionsOrEmail.type === 'oauth') {
      return await getProfile(optionsOrEmail.signal || signalParam)
    }

    const emailInput =
      typeof optionsOrEmail === 'object' ? optionsOrEmail.email! : optionsOrEmail
    const passwordInput =
      typeof optionsOrEmail === 'object' ? optionsOrEmail.password! : passwordParam!
    const signalInput =
      typeof optionsOrEmail === 'object'
        ? optionsOrEmail.signal || signalParam
        : signalParam

    // 1. Ensure CSRF token is initialized before login (also enforced by interceptor)
    await csrfManager.getToken()

    // 2. Send login request with credentials & CSRF
    const loginResponse = await loginUser(emailInput, passwordInput, signalInput)
    const loginFallback = normalizeProfileResponse(loginResponse.data)

    // 3. Refresh CSRF token after authentication state change
    try {
      await csrfManager.refreshToken()
    } catch {
      // Non-fatal
    }

    // 4. Fetch authenticated user profile from backend endpoint
    try {
      const profileResponse = await getUserProfile(signalInput)
      const fullProfile = normalizeProfileResponse(profileResponse.data, loginFallback)
      setUser(fullProfile)
      setAuthStatus('authenticated')
      setAuthError(null)
      return fullProfile
    } catch (profileErr: any) {
      if (axios.isCancel(profileErr)) throw profileErr
      // If login succeeded and cookies were set, preserve verified login payload if profile fetch fails transiently
      if (isTemporaryServiceUnavailable(profileErr)) {
        setUser(loginFallback)
        setAuthStatus('authenticated')
        return loginFallback
      }
      throw profileErr
    }
  }

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  const logout = async () => {
    try {
      await logoutUser()
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return
      }
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAuthStatus('unauthenticated')
      setAuthError(null)
      queryClient.clear()
      clearUserCachedData()
      csrfManager.clearToken()
      setToast({ message: 'Logout successful.', type: 'success' })
      navigate('/login', { replace: true })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authStatus,
        authError,
        loginState,
        login,
        logout,
        loading,
        getProfile,
        fetchProfile,
        retrySessionCheck: restoreSession,
        showToast,
      }}
    >
      {children}
      <NetworkStatusToast />
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// API Contract Endpoints routed through Gateway

export const registerUser = (
  username: string,
  email: string,
  password: string,
  signal?: AbortSignal
) => {
  return api.post('/api/auth/register', { username, email, password }, { signal })
}

export const verifySignupOtp = (email: string, otp: string, signal?: AbortSignal) => {
  return api.post('/api/auth/send-verify-otp', { email, otp }, { signal })
}

export const resendOtp = (email: string, signal?: AbortSignal) => {
  return api.post('/api/auth/resend-otp', { email }, { signal })
}

export const loginUser = (email: string, password: string, signal?: AbortSignal) => {
  return api.post('/api/auth/login', { email, password }, { signal })
}

export const forgotPassword = (email: string, signal?: AbortSignal) => {
  return api.post('/api/auth/forgot-password', { email }, { signal })
}

export const verifyResetOtp = (email: string, otp: string, signal?: AbortSignal) => {
  return api.post('/api/auth/send-reset-otp', { email, otp }, { signal })
}

export const resetPassword = (
  email: string,
  otp: string,
  newPassword: string,
  signal?: AbortSignal
) => {
  return api.post('/api/auth/reset-password', { email, otp, newPassword }, { signal })
}

export const getUserProfile = (signal?: AbortSignal) => {
  return api.get('/api/auth/profile', { signal })
}

export const getWhoAmI = (signal?: AbortSignal) => {
  return api.get<string>('/api/auth/whoami', { signal })
}

export const getProfile = getUserProfile

export const logoutUser = () => api.post('/api/auth/logout', {})

export const refreshToken = () => api.post('/api/auth/refresh', {})
