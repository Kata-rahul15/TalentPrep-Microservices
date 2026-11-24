import axios, { type AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { API } from '@/config/api'
import { csrfManager } from './csrfManager'

type MutableHeaders = AxiosHeaders | Record<string, unknown>

const removeRequestHeader = (headers: MutableHeaders | undefined, name: string): void => {
  if (!headers) return
  if (typeof (headers as AxiosHeaders).delete === 'function') {
    ;(headers as AxiosHeaders).delete(name)
  } else {
    delete (headers as Record<string, unknown>)[name]
  }
}

const setRequestHeader = (headers: MutableHeaders | undefined, name: string, value: string): void => {
  if (!headers) return
  if (typeof (headers as AxiosHeaders).set === 'function') {
    ;(headers as AxiosHeaders).set(name, value)
  } else {
    ;(headers as Record<string, unknown>)[name] = value
  }
}

const UNSAFE_HTTP_METHODS = new Set(['post', 'put', 'patch', 'delete'])

const STRIPPED_IDENTITY_HEADERS = [
  'X-Authenticated-User-Id',
  'X-Authenticated-User-Email',
  'X-User-Id',
  'X-User-Email',
  'X-Internal-Service-Token',
  'X-Internal-Service-Name',
]

const LEGACY_AUTH_ENDPOINTS = [
  '/login',
  '/register',
  '/send-verify-otp',
  '/resend-otp',
  '/forgot-password',
  '/send-reset-otp',
  '/reset-password',
  '/profile',
  '/logout',
  '/refresh',
]

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _csrfRetried?: boolean
}

/**
 * Shared API Gateway Axios client.
 * - Always sends HttpOnly cookies (`withCredentials: true`).
 * - Strips any accidentally supplied identity or internal headers.
 * - Automatically attaches CSRF token (`X-XSRF-TOKEN`) to unsafe HTTP requests.
 * - Lets the browser generate multipart boundaries when sending `FormData`.
 * - Coordinates single-flight 401 token refresh and safe single-retry CSRF recovery.
 */
export const api = axios.create({
  baseURL: API.BASE_URL,
  withCredentials: true,
})

// Single-flight refresh coordination shared across HTTP interceptor and WebSocket reconnects
let refreshPromise: Promise<void> | null = null

export const refreshAuthSession = async (): Promise<void> => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      await api.post('/api/auth/refresh', {})
      // Refresh CSRF token after session/token rotation so subsequent calls stay aligned
      try {
        await csrfManager.refreshToken()
      } catch {
        // Non-fatal: next unsafe request will lazily fetch CSRF token if needed
      }
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Request Interceptor
api.interceptors.request.use(async (config) => {
  if (config.url && LEGACY_AUTH_ENDPOINTS.includes(config.url)) {
    config.url = `/api/auth${config.url}`
  }

  // Never send browser-supplied identity or internal service headers
  if (config.headers) {
    for (const header of STRIPPED_IDENTITY_HEADERS) {
      removeRequestHeader(config.headers, header)
    }
  }

  // Let browser/Axios automatically set multipart/form-data boundary for FormData payloads
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    removeRequestHeader(config.headers, 'Content-Type')
  }

  // Ensure credentials are always enabled
  config.withCredentials = true

  // Attach CSRF token on unsafe HTTP methods
  const method = (config.method || 'get').toLowerCase()
  const requestUrl = (config.url || '').toLowerCase()
  if (UNSAFE_HTTP_METHODS.has(method) && !requestUrl.includes('/api/csrf')) {
    const csrfToken = await csrfManager.getToken()
    const headerName = csrfManager.getHeaderName()
    setRequestHeader(config.headers, headerName, csrfToken)
  }

  return config
})

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as RetryableRequestConfig | undefined
    const status = error?.response?.status

    if (!error?.response || !originalRequest) {
      return Promise.reject(error)
    }

    const requestUrl = (originalRequest.url || '').toLowerCase()
    const method = (originalRequest.method || 'get').toLowerCase()

    // 1. Handle Gateway CSRF validation failure (403 pre-routing rejection) once without infinite loops
    if (
      status === 403 &&
      UNSAFE_HTTP_METHODS.has(method) &&
      !originalRequest._csrfRetried &&
      csrfManager.isCsrfRejection(error)
    ) {
      originalRequest._csrfRetried = true
      try {
        const freshToken = await csrfManager.refreshToken()
        const headerName = csrfManager.getHeaderName()
        setRequestHeader(originalRequest.headers, headerName, freshToken)
        return api(originalRequest)
      } catch {
        return Promise.reject(error)
      }
    }

    // 2. Only attempt token refresh on HTTP 401 Unauthorized
    if (status !== 401) {
      return Promise.reject(error)
    }

    const isPublicAuthEndpoint =
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/send-verify-otp') ||
      requestUrl.includes('/auth/resend-otp') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/send-reset-otp') ||
      requestUrl.includes('/auth/reset-password') ||
      requestUrl.includes('/api/csrf')

    const isRefreshEndpoint = requestUrl.includes('/auth/refresh')

    if (isPublicAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshEndpoint || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await refreshAuthSession()
      return api(originalRequest)
    } catch (refreshError: unknown) {
      const refreshStatus = axios.isAxiosError(refreshError)
        ? refreshError.response?.status
        : undefined
      // Only treat explicit auth failures (401/403/400 missing refresh cookie) as logged out.
      // Never treat 503/502/504/network errors as proof that the user is logged out.
      if (refreshStatus === 401 || refreshStatus === 403 || refreshStatus === 400) {
        window.dispatchEvent(new CustomEvent('auth-unauthorized'))
      }
      return Promise.reject(refreshError)
    }
  }
)

/**
 * Centralized user-friendly API error extractor.
 * Never exposes stack traces, JWTs, or internal service credentials.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) {
    return ''
  }

  const axiosErr = axios.isAxiosError(error) ? error : null
  const status = axiosErr?.response?.status
  const requestUrl = (axiosErr?.config?.url || '').toLowerCase()

  if (status === 403 && csrfManager.isCsrfRejection(error)) {
    return 'Security verification failed (CSRF token expired or invalid). Please try again.'
  }

  // Extract sanitized backend response message across standard API error fields
  if (axiosErr?.response?.data) {
    const rawData = axiosErr.response.data

    if (typeof rawData === 'string') {
      if (
        rawData.length > 0 &&
        rawData.length < 200 &&
        !rawData.includes('Exception') &&
        !rawData.includes('at ')
      ) {
        return rawData
      }
    } else if (typeof rawData === 'object' && rawData !== null) {
      const data = rawData as Record<string, unknown>

      if (
        typeof data.message === 'string' &&
        data.message &&
        !data.message.includes('Exception') &&
        !data.message.includes('Stack:')
      ) {
        return data.message
      }

      if (
        typeof data.error === 'string' &&
        data.error &&
        data.error !== 'Forbidden' &&
        data.error !== 'Unauthorized' &&
        !data.error.includes('Exception') &&
        !data.error.includes('Stack:')
      ) {
        return data.error
      }

      if (typeof data.error_description === 'string' && data.error_description) {
        return data.error_description
      }

      if (typeof data.detail === 'string' && data.detail) {
        return data.detail
      }

      if (typeof data.errorMessage === 'string' && data.errorMessage) {
        return data.errorMessage
      }

      if (typeof data.description === 'string' && data.description) {
        return data.description
      }

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const firstErr = data.errors[0] as Record<string, unknown> | string
        if (typeof firstErr === 'string') return firstErr
        if (firstErr && typeof firstErr === 'object') {
          if (typeof firstErr.defaultMessage === 'string' && firstErr.defaultMessage) {
            return firstErr.defaultMessage
          }
          if (typeof firstErr.message === 'string' && firstErr.message) {
            return firstErr.message
          }
        }
      }
    }
  }

  const isRegisterRequest = requestUrl.includes('/register')
  const isLoginRequest = requestUrl.includes('/login')
  const isOtpRequest =
    requestUrl.includes('/send-verify-otp') || requestUrl.includes('/resend-otp')
  const isPasswordResetRequest =
    requestUrl.includes('/forgot-password') ||
    requestUrl.includes('/send-reset-otp') ||
    requestUrl.includes('/reset-password')
  const isPublicAuthRequest =
    isRegisterRequest || isLoginRequest || isOtpRequest || isPasswordResetRequest

  if (status) {
    switch (status) {
      case 400:
        if (isRegisterRequest) {
          return 'Registration request invalid. Please check your full name, email, and password.'
        }
        if (isLoginRequest) {
          return 'Invalid login request. Please enter a valid email and password.'
        }
        return 'Invalid request payload. Please check your inputs and try again.'

      case 401:
        if (isRegisterRequest) {
          return 'Registration failed. Please check your details and try again.'
        }
        if (isLoginRequest) {
          return 'Invalid email or password. Please try again.'
        }
        if (isOtpRequest) {
          return 'Invalid or expired verification code. Please try again.'
        }
        if (isPasswordResetRequest) {
          return 'Password reset authorization failed. Please request a new OTP.'
        }
        if (isPublicAuthRequest) {
          return 'Authentication failed. Please verify your details and try again.'
        }
        return 'Your session has expired. Please log in again.'

      case 403:
        if (isRegisterRequest) {
          return 'Registration rejected. An account with this email may already exist.'
        }
        if (isLoginRequest) {
          return 'Account unverified or access restricted.'
        }
        return 'You do not have permission to access this resource.'

      case 404:
        if (isLoginRequest) {
          return 'Account not found. Please check your email or sign up.'
        }
        return 'The requested resource was not found on the server.'

      case 409:
        if (isRegisterRequest) {
          return 'An account with this email address already exists.'
        }
        return 'This action conflicts with the current state. Please refresh and try again.'

      case 422:
        return 'Validation failed. Please check your inputs and try again.'

      case 429:
        return 'Too many requests or quota exceeded. Please wait a moment before trying again.'

      case 500:
        return 'An internal server error occurred. Please try again later.'

      case 502:
      case 503:
      case 504:
        return 'The service is temporarily unavailable. Please try again in a few moments.'
    }
  }

  const errCode = axiosErr?.code
  const errMessage =
    axiosErr?.message || (error instanceof Error ? error.message : '')

  if (errCode === 'ECONNABORTED' || errMessage.toLowerCase().includes('timeout')) {
    return 'The server request timed out. Please check your connection and retry.'
  }

  if (errMessage === 'Network Error' || errCode === 'ERR_NETWORK' || !navigator.onLine) {
    return 'Network connection error. Please check your internet connection or verify the backend server status.'
  }

  if (isRegisterRequest) {
    return 'Registration failed. Please try again.'
  }

  if (
    !axiosErr &&
    error instanceof Error &&
    error.message &&
    !error.message.includes('Exception') &&
    !error.message.includes('Stack:')
  ) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}
