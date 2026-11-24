import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/services/authService'
import { InterviewWebSocketClient } from '../services/interviewWebSocketService'
import type {
  InterviewCommandPayload,
  InterviewEvent,
  WebSocketConnectionStatus,
} from '../types/interview.types'

interface UseInterviewWebSocketOptions {
  sessionId?: string
  enabled?: boolean
  onEvent: (event: InterviewEvent) => void
  onReconnect: () => Promise<void> | void
  onSocketError?: (message: string) => void
}

/**
 * Manages the STOMP WebSocket connection lifecycle for an active interview room.
 * - Connects only when authenticated and session is active (`enabled === true`).
 * - Disconnects cleanly on unmount or when session finishes.
 * - Triggers authoritative REST reconciliation on reconnect without replaying commands.
 */
export function useInterviewWebSocket({
  sessionId,
  enabled = true,
  onEvent,
  onReconnect,
  onSocketError,
}: UseInterviewWebSocketOptions) {
  const { authStatus, user } = useAuth()
  const isAuthenticated = authStatus === 'authenticated' && Boolean(user)
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>('disconnected')
  const [statusDetail, setStatusDetail] = useState<string | null>(null)

  const clientRef = useRef<InterviewWebSocketClient | null>(null)
  const onEventRef = useRef(onEvent)
  const onReconnectRef = useRef(onReconnect)
  const onSocketErrorRef = useRef(onSocketError)

  useEffect(() => {
    onEventRef.current = onEvent
    onReconnectRef.current = onReconnect
    onSocketErrorRef.current = onSocketError
  }, [onEvent, onReconnect, onSocketError])

  const canConnect = Boolean(sessionId && enabled && isAuthenticated)

  useEffect(() => {
    if (!canConnect || !sessionId) {
      if (clientRef.current) {
        void clientRef.current.disconnect(true)
        clientRef.current = null
      }
      return
    }

    const client = new InterviewWebSocketClient(
      {
        onStatusChange: (status, detail) => {
          setConnectionStatus(status)
          setStatusDetail(detail ?? null)
        },
        onEvent: (event) => {
          onEventRef.current(event)
        },
        onReconnect: async () => {
          try {
            await onReconnectRef.current()
          } finally {
            client.markReconciled()
          }
        },
        onError: (msg) => {
          onSocketErrorRef.current?.(msg)
        },
      },
      sessionId
    )

    clientRef.current = client
    client.connect()

    return () => {
      clientRef.current = null
      void client.disconnect(true)
    }
  }, [sessionId, canConnect])

  const effectiveConnectionStatus: WebSocketConnectionStatus = canConnect
    ? connectionStatus
    : 'disconnected'

  const sendCommand = useCallback(
    (payload: InterviewCommandPayload): string => {
      if (!sessionId || !clientRef.current) {
        throw new Error('Live interview session channel is not initialized.')
      }
      return clientRef.current.sendCommand(sessionId, payload)
    },
    [sessionId]
  )

  const reconnect = useCallback(async () => {
    if (!clientRef.current) return
    await clientRef.current.reconnect()
  }, [])

  return {
    connectionStatus: effectiveConnectionStatus,
    statusDetail: canConnect ? statusDetail : null,
    isConnected: effectiveConnectionStatus === 'connected',
    isReconciling: effectiveConnectionStatus === 'reconciling',
    sendCommand,
    reconnect,
  }
}
