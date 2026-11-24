import { useState, useEffect, useRef, useCallback } from 'react'
import { checkServiceReadiness } from '@/services/healthService'
import type { ServiceReadinessResponse } from '@/services/healthService'
import { API } from '@/config/api'

export type ServiceConnectionStatus = 'connecting' | 'waking' | 'ready' | 'connected' | 'unavailable'

// In-memory flag and timestamp for the current page session lifecycle
let globalReadinessVerified = false
let globalReadinessTimestamp = 0
const READINESS_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes cache TTL

export const isReadinessVerified = (): boolean => {
  if (!globalReadinessVerified) return false
  const age = Date.now() - globalReadinessTimestamp
  if (age > READINESS_CACHE_TTL_MS) {
    globalReadinessVerified = false
    globalReadinessTimestamp = 0
    return false
  }
  return true
}

export const setReadinessVerified = (verified: boolean) => {
  globalReadinessVerified = verified
  globalReadinessTimestamp = verified ? Date.now() : 0
}

export const invalidateReadiness = () => {
  globalReadinessVerified = false
  globalReadinessTimestamp = 0
}

export interface UseServiceReadinessReturn {
  isChecking: boolean
  isReady: boolean
  isTimedOut: boolean
  isFailed: boolean
  errorMessage: string | null
  elapsedSeconds: number
  gatewayStatus: ServiceConnectionStatus
  authStatus: ServiceConnectionStatus
  resumeStatus: ServiceConnectionStatus
  dynamicMessage: string
  checkReadiness: (options?: { force?: boolean }) => void
  retry: () => void
}

const POLLING_INTERVAL_MS = 3000 // 3 seconds
const MAX_TIMEOUT_MS = 90000 // 90 seconds

export function useServiceReadiness(autoStart = false): UseServiceReadinessReturn {
  const isCurrentlyVerified = isReadinessVerified()

  const [isChecking, setIsChecking] = useState<boolean>(!isCurrentlyVerified && autoStart)
  const [isReady, setIsReady] = useState<boolean>(isCurrentlyVerified)
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false)
  const [isFailed, setIsFailed] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  const [gatewayStatus, setGatewayStatus] = useState<ServiceConnectionStatus>(
    isCurrentlyVerified ? 'connected' : 'connecting'
  )
  const [authStatus, setAuthStatus] = useState<ServiceConnectionStatus>(
    isCurrentlyVerified ? 'ready' : 'waking'
  )
  const [resumeStatus, setResumeStatus] = useState<ServiceConnectionStatus>(
    isCurrentlyVerified ? 'ready' : 'waking'
  )

  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const inFlightRef = useRef<boolean>(false)
  const startTimeRef = useRef<number>(0)

  // Clear all running timers
  const clearTimers = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current)
      elapsedTimerRef.current = null
    }
  }, [])

  // Cancel any pending HTTP request
  const abortPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    inFlightRef.current = false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers()
      abortPendingRequest()
    }
  }, [clearTimers, abortPendingRequest])

  const pollAttemptRef = useRef<number>(0)

  // Single poll execution step
  const executePollStep = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    pollAttemptRef.current += 1

    // Check timeout limit
    const totalElapsedMs = Date.now() - startTimeRef.current
    if (totalElapsedMs >= MAX_TIMEOUT_MS) {
      console.warn(`[ServiceReadiness] Polling timeout reached (${MAX_TIMEOUT_MS / 1000}s). Stopping readiness checks.`)
      clearTimers()
      abortPendingRequest()
      setIsChecking(false)
      setIsTimedOut(true)
      setIsFailed(true)
      setGatewayStatus('unavailable')
      setAuthStatus('unavailable')
      setResumeStatus('unavailable')
      setErrorMessage('Services are taking longer than expected.')
      return
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const data: ServiceReadinessResponse = await checkServiceReadiness(
        controller.signal,
        pollAttemptRef.current
      )
      inFlightRef.current = false

      // Gateway request succeeded (even 503 means request reached Gateway)
      setGatewayStatus('connected')

      // Update auth service status
      if (data.authService === 'UP' || data.ready) {
        setAuthStatus('ready')
      } else {
        setAuthStatus('waking')
      }

      // Update resume service status
      if (data.resumeService === 'UP' || data.ready) {
        setResumeStatus('ready')
      } else {
        setResumeStatus('waking')
      }

      if (data.ready) {
        console.log('[ServiceReadiness] Readiness confirmed! All microservices ready.')
        setReadinessVerified(true)
        setIsReady(true)
        setIsChecking(false)
        setGatewayStatus('connected')
        setAuthStatus('ready')
        setResumeStatus('ready')
        clearTimers()
        return
      }

      // Not ready yet: schedule next poll in 3 seconds
      if (Date.now() - startTimeRef.current < MAX_TIMEOUT_MS) {
        pollingTimerRef.current = setTimeout(() => {
          executePollStep()
        }, POLLING_INTERVAL_MS)
      }
    } catch (err: any) {
      inFlightRef.current = false

      if (err?.name === 'CanceledError' || err?.message?.includes('canceled')) {
        return
      }

      // Non-retryable auth error
      if (err?.message?.includes('Authentication failure')) {
        console.error('[ServiceReadiness] Non-retryable authentication failure:', err.message)
        clearTimers()
        setIsChecking(false)
        setIsFailed(true)
        setErrorMessage(err.message)
        return
      }

      // Retry on network/503 errors if within 90s limit
      if (Date.now() - startTimeRef.current < MAX_TIMEOUT_MS) {
        pollingTimerRef.current = setTimeout(() => {
          executePollStep()
        }, POLLING_INTERVAL_MS)
      }
    }
  }, [clearTimers, abortPendingRequest])

  // Start polling workflow
  const startCheck = useCallback(
    (options?: { force?: boolean }) => {
      if (isReadinessVerified() && !options?.force) {
        console.log('[ServiceReadiness] Services already verified ready in current session.')
        setIsReady(true)
        setIsChecking(false)
        setGatewayStatus('connected')
        setAuthStatus('ready')
        setResumeStatus('ready')
        return
      }

      console.log('[ServiceReadiness] Readiness polling started')
      console.log('[ServiceReadiness] Readiness request URL:', `${API.BASE_URL.replace(/\/+$/, '')}/health/ready`)

      clearTimers()
      abortPendingRequest()
      pollAttemptRef.current = 0

      setIsChecking(true)
      setIsReady(false)
      setIsTimedOut(false)
      setIsFailed(false)
      setErrorMessage(null)
      setElapsedSeconds(0)

      setGatewayStatus('connecting')
      setAuthStatus('waking')
      setResumeStatus('waking')

      startTimeRef.current = Date.now()

      // Increment elapsed time counter every 1s
      elapsedTimerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsedSeconds(seconds)
      }, 1000)

      // Initial immediate check
      executePollStep()
    },
    [clearTimers, abortPendingRequest, executePollStep]
  )

  // Automatically start on mount if autoStart is true and not yet verified
  useEffect(() => {
    if (autoStart && !isReadinessVerified() && !isReady && !isTimedOut && !isFailed) {
      startCheck()
    }
  }, [autoStart, startCheck, isReady, isTimedOut, isFailed])

  const retry = useCallback(() => {
    console.log('[ServiceReadiness] Manual retry triggered.')
    invalidateReadiness()
    startCheck({ force: true })
  }, [startCheck])

  // Compute dynamic calm status message
  let dynamicMessage = 'Connecting to TalentPrep...'
  if (isReady) {
    dynamicMessage = 'Everything is ready. Taking you to your workspace...'
  } else if (isTimedOut || isFailed) {
    dynamicMessage = 'Services are taking longer than expected.'
  } else if (elapsedSeconds > 15) {
    dynamicMessage = 'Your workspace is taking a little longer to prepare.'
  } else if (elapsedSeconds > 5) {
    dynamicMessage = 'Waking up your services...'
  }

  return {
    isChecking,
    isReady,
    isTimedOut,
    isFailed,
    errorMessage,
    elapsedSeconds,
    gatewayStatus,
    authStatus,
    resumeStatus,
    dynamicMessage,
    checkReadiness: startCheck,
    retry,
  }
}
