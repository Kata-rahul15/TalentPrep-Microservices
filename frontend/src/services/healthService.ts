
import axios from 'axios'
import { API } from '@/config/api'

export interface ServiceReadinessResponse {
  status: string
  authService?: string
  resumeService?: string
  ready: boolean
}

/**
 * Calls the API Gateway readiness endpoint GET /health/ready.
 * Falls back to public GET /health if /health/ready is gated by Gateway JWT filter (HTTP 401/403)
 * for unauthenticated visitors on /login or /signup.
 */
export const checkServiceReadiness = async (
  signal?: AbortSignal,
  pollAttempt: number = 1
): Promise<ServiceReadinessResponse> => {
  const gatewayUrl = API.BASE_URL.replace(/\/+$/, '')
  const readinessUrl = `${gatewayUrl}/health/ready`

  console.log(`[ServiceReadiness] Poll attempt number: ${pollAttempt}`)

  try {
    const response = await axios.get<ServiceReadinessResponse>(readinessUrl, {
      signal,
      timeout: 8000,
      withCredentials: true,
    })

    if (response.data && typeof response.data === 'object') {
      return {
        status: response.data.status || (response.data.ready ? 'READY' : 'STARTING'),
        authService: response.data.authService || (response.data.ready ? 'UP' : 'STARTING'),
        resumeService: response.data.resumeService || (response.data.ready ? 'UP' : 'STARTING'),
        ready: Boolean(response.data.ready),
      }
    }

    return {
      status: 'STARTING',
      authService: 'STARTING',
      resumeService: 'STARTING',
      ready: false,
    }
  } catch (err: any) {
    if (axios.isCancel(err)) {
      throw err
    }

    const status = err.response?.status

    // HTTP 503 is a standard cold-start response when microservices are booting up
    if (status === 503 && err.response?.data) {
      const data = err.response.data
      return {
        status: data.status || 'STARTING',
        authService: data.authService || 'STARTING',
        resumeService: data.resumeService || 'STARTING',
        ready: false,
      }
    }

    // If readiness endpoint returns 401/403, fall back to public health endpoint
    if (status === 401 || status === 403) {
      try {
        const healthResp = await axios.get(`${gatewayUrl}/health`, {
          signal,
          timeout: 8000,
          withCredentials: true,
        })

        if (healthResp.status >= 200 && healthResp.status < 300) {
          return {
            status: 'READY',
            authService: 'UP',
            resumeService: 'UP',
            ready: true,
          }
        }
      } catch (healthErr: any) {
        if (axios.isCancel(healthErr)) {
          throw healthErr
        }
      }
    }

    // Cold start network connection error, gateway timeout, or 502/503 without body
    return {
      status: 'STARTING',
      authService: 'STARTING',
      resumeService: 'STARTING',
      ready: false,
    }
  }
}
