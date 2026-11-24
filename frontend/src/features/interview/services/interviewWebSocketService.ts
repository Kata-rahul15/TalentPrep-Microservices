import { Client, type IFrame, type IMessage, type StompSubscription } from '@stomp/stompjs'
import { API } from '@/config/api'
import { csrfManager } from '@/api/csrfManager'
import { refreshAuthSession } from '@/api/apiClient'
import type {
  InterviewCommandPayload,
  InterviewEvent,
  WebSocketConnectionStatus,
} from '../types/interview.types'

export interface InterviewSocketCallbacks {
  onStatusChange?: (status: WebSocketConnectionStatus, detail?: string | null) => void
  onEvent?: (event: InterviewEvent) => void
  onReconnect?: () => void
  onError?: (message: string) => void
}

const generateCommandId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * STOMP-over-WebSocket manager for live TalentPrep interview sessions.
 * Connects only to the API Gateway (`/ws/interviews`) with browser-managed
 * HttpOnly cookies and double-submit CSRF token (`X-XSRF-TOKEN`) in STOMP CONNECT.
 */
export class InterviewWebSocketClient {
  private client: Client | null = null
  private subscription: StompSubscription | null = null
  private topicSubscription: StompSubscription | null = null
  private callbacks: InterviewSocketCallbacks
  private status: WebSocketConnectionStatus = 'disconnected'
  private hasConnectedOnce = false
  private isReconnectCycle = false
  private needsTokenRefresh = false
  private needsCsrfRefresh = false
  private manualDisconnect = false
  private sessionId?: string
  private seenEventIds = new Set<string>()

  constructor(callbacks: InterviewSocketCallbacks = {}, sessionId?: string) {
    this.callbacks = callbacks
    this.sessionId = sessionId
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId
  }

  updateCallbacks(callbacks: InterviewSocketCallbacks): void {
    this.callbacks = callbacks
  }

  getStatus(): WebSocketConnectionStatus {
    return this.status
  }

  isConnected(): boolean {
    return Boolean(this.client?.connected)
  }

  private setStatus(next: WebSocketConnectionStatus, detail?: string | null): void {
    this.status = next
    this.callbacks.onStatusChange?.(next, detail)
  }

  connect(): void {
    if (this.client && (this.client.active || this.client.connected)) {
      return
    }

    this.manualDisconnect = false
    this.setStatus(this.hasConnectedOnce ? 'reconnecting' : 'connecting', null)

    const client = new Client({
      brokerURL: API.INTERVIEW_WS_URL,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectionTimeout: 15000,

      beforeConnect: async () => {
        if (this.manualDisconnect) {
          throw new Error('WebSocket connection aborted after disconnect.')
        }

        if (this.isReconnectCycle) {
          this.setStatus('reconnecting', null)
        }

        // Refresh expired AccessToken cookie before handshake if server closed with 1008
        if (this.needsTokenRefresh) {
          try {
            await refreshAuthSession()
          } catch (err) {
            this.callbacks.onError?.(
              'Your session could not be refreshed automatically. Please verify your login or reconnect.'
            )
            throw err
          } finally {
            this.needsTokenRefresh = false
          }
        }

        if (this.manualDisconnect) {
          throw new Error('WebSocket connection aborted during cleanup.')
        }

        // Ensure CSRF token + XSRF-TOKEN cookie match before WebSocket handshake
        try {
          const csrfToken =
            this.isReconnectCycle || this.needsCsrfRefresh
              ? await csrfManager.refreshToken()
              : await csrfManager.getToken()

          if (this.manualDisconnect) {
            throw new Error('WebSocket connection aborted before STOMP connect.')
          }

          this.needsCsrfRefresh = false
          client.connectHeaders = {
            [csrfManager.getHeaderName()]: csrfToken,
          }
        } catch (err) {
          if (this.manualDisconnect) {
            throw err
          }
          this.setStatus('error', 'Failed to initialize CSRF security token for WebSocket.')
          this.callbacks.onError?.(
            'Security handshake failed while preparing live interview connection.'
          )
          throw err
        }
      },

      onConnect: () => {
        if (this.manualDisconnect) {
          void client.deactivate()
          return
        }

        // Ensure cleanly reset subscriptions per active STOMP connection
        if (this.subscription) {
          try {
            this.subscription.unsubscribe()
          } catch {
            // ignore stale subscription cleanup error
          }
          this.subscription = null
        }
        if (this.topicSubscription) {
          try {
            this.topicSubscription.unsubscribe()
          } catch {
            // ignore stale topic cleanup error
          }
          this.topicSubscription = null
        }

        this.subscription = client.subscribe('/user/queue/interviews/events', (frame: IMessage) => {
          this.handleIncomingFrame(frame)
        })

        if (this.sessionId) {
          this.topicSubscription = client.subscribe(
            `/topic/interviews/${this.sessionId}`,
            (frame: IMessage) => {
              this.handleIncomingFrame(frame)
            }
          )
        }

        const wasReconnect = this.hasConnectedOnce
        this.hasConnectedOnce = true
        this.isReconnectCycle = false

        if (wasReconnect) {
          this.setStatus('reconciling', null)
          this.callbacks.onReconnect?.()
        } else {
          this.setStatus('connected', null)
        }
      },

      onDisconnect: () => {
        this.subscription = null
        this.topicSubscription = null
        if (!this.manualDisconnect) {
          this.isReconnectCycle = true
          this.setStatus('reconnecting', null)
        } else {
          this.setStatus('disconnected', null)
        }
      },

      onStompError: (frame: IFrame) => {
        const message =
          frame.headers?.message || frame.body || 'STOMP protocol error on live interview channel.'
        if (/csrf|xsrf/i.test(message)) {
          this.needsCsrfRefresh = true
        }
        if (/unauthori|expired|token|401/i.test(message)) {
          this.needsTokenRefresh = true
          this.needsCsrfRefresh = true
        }
        this.isReconnectCycle = true
        this.setStatus('error', message)
        this.callbacks.onError?.(message)
      },

      onWebSocketError: () => {
        if (!this.manualDisconnect) {
          this.isReconnectCycle = true
          this.needsCsrfRefresh = true
          this.setStatus('reconnecting', 'Live interview connection interrupted. Reconnecting...')
        }
      },

      onWebSocketClose: (event: CloseEvent) => {
        this.subscription = null
        if (this.manualDisconnect) {
          this.setStatus('disconnected', null)
          return
        }

        this.isReconnectCycle = true
        const closeReason = event?.reason || ''
        if (event?.code === 1008 || /expired|unauthorized|token/i.test(closeReason)) {
          this.needsTokenRefresh = true
          this.needsCsrfRefresh = true
          this.setStatus('reconnecting', 'Session token rotated. Reconnecting live channel...')
        } else {
          this.needsCsrfRefresh = true
          this.setStatus('reconnecting', 'Connection lost. Reconnecting to interview channel...')
        }
      },
    })

    this.client = client
    client.activate()
  }

  /**
   * Forces a clean reconnect cycle (e.g., manual Reconnect button).
   */
  async reconnect(): Promise<void> {
    this.isReconnectCycle = this.hasConnectedOnce
    this.needsCsrfRefresh = true
    await this.disconnect(false)
    this.connect()
  }

  async disconnect(resetHistory = true): Promise<void> {
    this.manualDisconnect = true

    if (this.subscription) {
      try {
        this.subscription.unsubscribe()
      } catch {
        // ignore unsubscribe errors on closing socket
      }
      this.subscription = null
    }

    if (this.topicSubscription) {
      try {
        this.topicSubscription.unsubscribe()
      } catch {
        // ignore unsubscribe errors on closing socket
      }
      this.topicSubscription = null
    }

    const activeClient = this.client
    this.client = null

    if (resetHistory) {
      this.hasConnectedOnce = false
      this.isReconnectCycle = false
      this.needsTokenRefresh = false
      this.needsCsrfRefresh = false
    }

    if (activeClient) {
      try {
        await activeClient.deactivate()
      } catch {
        // ignore cleanup failure
      }
    }

    if (resetHistory) {
      this.setStatus('disconnected', null)
    }
  }

  /**
   * Marks reconciliation complete once REST session state has been fetched after reconnect.
   */
  markReconciled(): void {
    if (this.client?.connected) {
      this.setStatus('connected', null)
    }
  }

  /**
   * Sends a live interview command to `/app/interviews/{sessionId}/commands`.
   * Returns the generated `commandId` for tracking acknowledgments/completion.
   */
  sendCommand(sessionId: string, payload: InterviewCommandPayload): string {
    if (!this.client || !this.client.connected) {
      throw new Error('Live interview channel is not connected yet. Please wait or reconnect.')
    }

    const commandId = payload.commandId || generateCommandId()
    const body: InterviewCommandPayload = {
      commandId,
      type: payload.type,
    }

    if (payload.questionId !== undefined) {
      body.questionId = payload.questionId
    }
    if (payload.answerText !== undefined) {
      body.answerText = payload.answerText
    }
    if (payload.timeTakenSeconds !== undefined) {
      body.timeTakenSeconds = payload.timeTakenSeconds
    }

    this.client.publish({
      destination: `/app/interviews/${sessionId}/commands`,
      body: JSON.stringify(body),
    })

    return commandId
  }

  private handleIncomingFrame(frame: IMessage): void {
    if (!frame.body) return
    try {
      const raw = JSON.parse(frame.body)
      if (!raw) return

      // Deduplicate events by eventId
      if (raw.eventId) {
        if (this.seenEventIds.has(raw.eventId)) {
          return
        }
        this.seenEventIds.add(raw.eventId)
        if (this.seenEventIds.size > 200) {
          const first = this.seenEventIds.values().next().value
          if (first) this.seenEventIds.delete(first)
        }
      }

      // Normalize event type (supports both type and eventType)
      const eventType = raw.type || raw.eventType
      if (!eventType) return

      const event: InterviewEvent = {
        eventId: raw.eventId || `evt-${Date.now()}`,
        commandId: raw.commandId ?? null,
        type: eventType,
        eventType: eventType,
        sessionId: raw.sessionId,
        turnSequence: raw.turnSequence,
        timestamp: raw.timestamp || raw.occurredAt || new Date().toISOString(),
        occurredAt: raw.occurredAt || raw.timestamp,
        payload: raw.payload,
        errorCode: raw.errorCode ?? null,
        message: raw.message ?? null,
      }

      this.callbacks.onEvent?.(event)
    } catch {
      this.callbacks.onError?.('Received malformed event payload from interview service.')
    }
  }
}

