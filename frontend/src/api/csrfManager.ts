
import axios from 'axios'
import { API } from '@/config/api'

export interface CsrfTokenResponse {
  headerName?: string
  parameterName?: string
  token?: string
  message?: string
}

const DEFAULT_CSRF_HEADER = 'X-XSRF-TOKEN'

/**
 * Centralized in-memory CSRF token manager.
 * - Fetches token from Gateway GET /api/csrf with credentials included.
 * - Deduplicates concurrent token initialization/refresh calls.
 * - Keeps token strictly in memory (never in localStorage/sessionStorage).
 */
class CsrfManager {
  private token: string | null = null
  private headerName: string = DEFAULT_CSRF_HEADER
  private inFlightPromise: Promise<string> | null = null

  /**
   * Returns the current in-memory CSRF token,
   * fetching it if not yet initialized.
   */
  async getToken(): Promise<string> {
    if (this.token) {
      return this.token
    }

    return this.refreshToken()
  }

  /**
   * Forces a fresh CSRF token fetch from the API Gateway.
   * Concurrent callers share the same in-flight request.
   */
  async refreshToken(): Promise<string> {
    if (this.inFlightPromise) {
      return this.inFlightPromise
    }

    this.inFlightPromise = (async () => {
      try {
        const response = await axios.get<CsrfTokenResponse>(
          API.CSRF_URL,
          {
            withCredentials: true,
            timeout: 15000,
          }
        )

        const data = response.data
        const fetchedToken = data?.token?.trim()

        if (!fetchedToken) {
          throw new Error(
            'Gateway /api/csrf did not return a valid CSRF token.'
          )
        }

        this.token = fetchedToken
        this.headerName =
          data?.headerName?.trim() || DEFAULT_CSRF_HEADER

        return fetchedToken
      } catch (err) {
        this.token = null
        throw err
      } finally {
        this.inFlightPromise = null
      }
    })()

    return this.inFlightPromise
  }

  getHeaderName(): string {
    return this.headerName || DEFAULT_CSRF_HEADER
  }

  clearToken(): void {
    this.token = null
    this.headerName = DEFAULT_CSRF_HEADER
  }

  /**
   * Distinguishes a Gateway Spring Security CSRF 403 rejection
   * from business/ownership 403 errors.
   */
  isCsrfRejection(error: unknown): boolean {
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 403
    ) {
      return false
    }

    const data = error.response.data as
      | Record<string, unknown>
      | string
      | undefined
      | null

    // Auth Service unverified account returns JSON
    // with errorCode ACCOUNT_NOT_VERIFIED.
    if (data && typeof data === 'object') {
      if (
        data.errorCode === 'ACCOUNT_NOT_VERIFIED' ||
        data.error === 'FORBIDDEN'
      ) {
        return false
      }

      const msg = String(
        data.message || data.error || ''
      ).toLowerCase()

      if (msg.includes('csrf') || msg.includes('xsrf')) {
        return true
      }

      // Downstream structured JSON errors are not Gateway CSRF errors.
      if (data.status === 403 && data.timestamp) {
        return false
      }
    }

    if (typeof data === 'string') {
      const lower = data.toLowerCase()
      const trimmedLower = lower.trim()

      if (lower.includes('csrf') || lower.includes('xsrf')) {
        return true
      }

      if (
        trimmedLower === '' ||
        trimmedLower === 'access denied' ||
        lower.includes('expected csrf') ||
        lower.includes('invalid csrf')
      ) {
        return true
      }
    }

    // Empty 403 body from Gateway WebFlux security filter.
    return data === '' || data === undefined || data === null
  }
}

export const csrfManager = new CsrfManager()

