import { useState, useEffect, useRef, useCallback } from 'react'

// Browser Web Speech API type definitions for TypeScript
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
  onend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
  onerror: ((this: IWindowSpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: IWindowSpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onspeechstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
  onspeechend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
  onaudiostart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
  onaudioend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
  onsoundstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
  onsoundend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface IWindow extends Window {
  SpeechRecognition?: {
    new (): IWindowSpeechRecognition
  }
  webkitSpeechRecognition?: {
    new (): IWindowSpeechRecognition
  }
}

export type MicrophonePermissionState = 'prompt' | 'granted' | 'denied' | 'unknown'

export interface UseSpeechRecognitionResult {
  transcript: string
  finalTranscript: string
  interimTranscript: string
  liveTranscript: string
  isListening: boolean
  isSpeaking: boolean
  isSupported: boolean
  permissionStatus: MicrophonePermissionState
  error: string | null
  charCount: number
  wordCount: number
  startListening: () => Promise<void>
  stopListening: () => void
  resetTranscript: () => void
  setTranscript: (text: string) => void
  requestMicrophonePermission: () => Promise<boolean>
}

export function useSpeechRecognition(lang = 'en-IN'): UseSpeechRecognitionResult {
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<MicrophonePermissionState>('unknown')
  const [error, setError] = useState<string | null>(null)

  // Accumulation refs to guarantee zero text duplication across restarts and interim results
  const baseTranscriptRef = useRef('') // Permanently finalized text from previous sessions / manual edits
  const currentSessionFinalRef = useRef('') // Finalized text in the currently active recognition session
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null)
  const isRecordingIntentRef = useRef(false) // Explicit user intent: recording vs paused
  const restartTimeoutRef = useRef<number | null>(null)
  const isStartingRef = useRef(false)
  const createAndStartRecognitionRef = useRef<() => void>(() => {})

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? (window as unknown as IWindow).SpeechRecognition ||
        (window as unknown as IWindow).webkitSpeechRecognition
      : undefined

  const isSupported = Boolean(SpeechRecognitionClass)

  // Set transcript allows candidate to edit the answer manually
  const setTranscript = useCallback((text: string) => {
    baseTranscriptRef.current = text
    currentSessionFinalRef.current = ''
    setFinalTranscript(text)
    setInterimTranscript('')
  }, [])

  // Explicitly prompt for or verify microphone hardware & permissions
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not supported by your browser environment.')
      setPermissionStatus('denied')
      return false
    }

    try {
      // If browser supports navigator.permissions, check current permission status first
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          if (status.state === 'granted') {
            setPermissionStatus('granted')
            setError(null)
            return true
          }
          if (status.state === 'denied') {
            setPermissionStatus('denied')
            setError('Microphone permission denied. Please allow microphone access in your browser settings to speak.')
            return false
          }
        } catch {
          // Fall through to getUserMedia if query is unsupported
        }
      }

      // Check audio input devices if enumerateDevices is available
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasAudioInput = devices.some((d) => d.kind === 'audioinput')
        if (!hasAudioInput && devices.length > 0) {
          setError('Microphone unavailable. No microphone input device was found on this system.')
          setPermissionStatus('denied')
          return false
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Release media stream tracks immediately so Web Speech API has exclusive device access
      stream.getTracks().forEach((track) => track.stop())
      setPermissionStatus('granted')
      setError(null)
      return true
    } catch (err: unknown) {
      const errName = (err as { name?: string })?.name
      setPermissionStatus('denied')
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please allow microphone access in your browser to speak.')
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setError('Microphone unavailable. No audio input device detected.')
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setError('Microphone is busy or locked by another application.')
      } else {
        setError('Unable to access microphone. Please check your system audio settings.')
      }
      return false
    }
  }, [])

  const stopListening = useCallback(() => {
    isRecordingIntentRef.current = false

    if (restartTimeoutRef.current !== null) {
      window.clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    // Flush any session finalized text into the base transcript
    if (currentSessionFinalRef.current) {
      const base = baseTranscriptRef.current.trim()
      baseTranscriptRef.current = base
        ? `${base} ${currentSessionFinalRef.current.trim()}`
        : currentSessionFinalRef.current.trim()
      currentSessionFinalRef.current = ''
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignored if already stopping
      }
    }

    setIsListening(false)
    setIsSpeaking(false)
    setInterimTranscript('')
  }, [])

  const startRecognitionInstance = useCallback(() => {
    if (!SpeechRecognitionClass) return

    // Safely dispose any previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.onspeechstart = null
        recognitionRef.current.onspeechend = null
        recognitionRef.current.onaudiostart = null
        recognitionRef.current.onaudioend = null
        recognitionRef.current.onsoundstart = null
        recognitionRef.current.onsoundend = null
        recognitionRef.current.abort()
      } catch {
        // Ignore abort errors
      }
      recognitionRef.current = null
    }

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      setPermissionStatus('granted')
    }

    recognition.onspeechstart = () => {
      setIsSpeaking(true)
    }

    recognition.onspeechend = () => {
      setIsSpeaking(false)
    }

    recognition.onsoundstart = () => {
      setIsSpeaking(true)
    }

    recognition.onsoundend = () => {
      setIsSpeaking(false)
    }

    recognition.onaudiostart = () => {
      setIsListening(true)
    }

    recognition.onaudioend = () => {
      setIsSpeaking(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let sessionFinal = ''
      let sessionInterim = ''

      // Process all results in the current recognition session
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript || ''
        if (result.isFinal) {
          sessionFinal += (sessionFinal ? ' ' : '') + text.trim()
        } else {
          sessionInterim += (sessionInterim ? ' ' : '') + text.trim()
        }
      }

      currentSessionFinalRef.current = sessionFinal.trim()

      const base = baseTranscriptRef.current.trim()
      const combinedFinal = base
        ? sessionFinal.trim()
          ? `${base} ${sessionFinal.trim()}`
          : base
        : sessionFinal.trim()

      setFinalTranscript(combinedFinal)
      setInterimTranscript(sessionInterim.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[useSpeechRecognition] onerror:', event.error)

      if (event.error === 'no-speech') {
        // Normal silence during thinking pauses. Keep listening if user still intends to record.
        return
      }

      if (event.error === 'aborted') {
        // Clean programmatic abort or restart; ignore.
        return
      }

      // Handle terminal or configuration errors
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        isRecordingIntentRef.current = false
        setIsListening(false)
        setIsSpeaking(false)
        setPermissionStatus('denied')
        setError('Microphone permission denied. Please allow microphone access in your browser settings to speak.')
        return
      }

      if (event.error === 'audio-capture') {
        setIsSpeaking(false)
        setError('Microphone unavailable or in use by another application. Please check your audio settings.')
        return
      }

      if (event.error === 'network') {
        setIsSpeaking(false)
        setError('Speech recognition network error. Speech service was unreachable. Please type or check connection.')
        return
      }

      if (event.error === 'service-not-allowed') {
        isRecordingIntentRef.current = false
        setIsListening(false)
        setIsSpeaking(false)
        setError('Speech recognition service is unavailable on this browser/platform. Please type your answer.')
        return
      }

      setError(`Speech recognition error: ${event.error}`)
    }

    recognition.onend = () => {
      // Flush current session finalized text into the base transcript
      if (currentSessionFinalRef.current) {
        const base = baseTranscriptRef.current.trim()
        baseTranscriptRef.current = base
          ? `${base} ${currentSessionFinalRef.current.trim()}`
          : currentSessionFinalRef.current.trim()
        currentSessionFinalRef.current = ''
      }

      setInterimTranscript('')
      setIsSpeaking(false)

      // Auto-restart if candidate is still actively recording (explicit recording intent)
      if (isRecordingIntentRef.current) {
        if (restartTimeoutRef.current !== null) {
          window.clearTimeout(restartTimeoutRef.current)
        }
        // Small buffer to let browser audio subsystem cycle cleanly
        restartTimeoutRef.current = window.setTimeout(() => {
          if (isRecordingIntentRef.current) {
            createAndStartRecognitionRef.current()
          }
        }, 150)
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (err: unknown) {
      console.warn('[useSpeechRecognition] start() failed:', err)
      // If recognition is already active or transitioning, do not kill recording intent
      const isAlreadyStarted = err instanceof Error && err.name === 'InvalidStateError'
      if (!isAlreadyStarted) {
        isRecordingIntentRef.current = false
        setIsListening(false)
        setIsSpeaking(false)
        setError('Failed to start speech recognition. Please check microphone permissions or switch to chat.')
      }
    }
  }, [SpeechRecognitionClass, lang])

  useEffect(() => {
    createAndStartRecognitionRef.current = startRecognitionInstance
  }, [startRecognitionInstance])

  const startListening = useCallback(async () => {
    if (isStartingRef.current) return
    isStartingRef.current = true

    try {
      if (!SpeechRecognitionClass) {
        setError('Speech recognition is not supported in this browser. Please use Google Chrome or type your answer.')
        return
      }

      setError(null)
      isRecordingIntentRef.current = true
      setIsListening(true)

      // Verify microphone permission before launching recognition if not already granted
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestMicrophonePermission()
        if (!hasPermission) {
          isRecordingIntentRef.current = false
          setIsListening(false)
          return
        }
      }

      createAndStartRecognitionRef.current()
    } finally {
      isStartingRef.current = false
    }
  }, [SpeechRecognitionClass, permissionStatus, requestMicrophonePermission])

  const resetTranscript = useCallback(() => {
    baseTranscriptRef.current = ''
    currentSessionFinalRef.current = ''
    setFinalTranscript('')
    setInterimTranscript('')
  }, [])

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      isRecordingIntentRef.current = false
      if (restartTimeoutRef.current !== null) {
        window.clearTimeout(restartTimeoutRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null
          recognitionRef.current.onresult = null
          recognitionRef.current.onerror = null
          recognitionRef.current.onend = null
          recognitionRef.current.onspeechstart = null
          recognitionRef.current.onspeechend = null
          recognitionRef.current.onaudiostart = null
          recognitionRef.current.onaudioend = null
          recognitionRef.current.onsoundstart = null
          recognitionRef.current.onsoundend = null
          recognitionRef.current.abort()
        } catch {
          // Ignore
        }
      }
    }
  }, [])

  // Clean combination of finalized transcript and live interim transcript
  const liveTranscript = finalTranscript
    ? interimTranscript
      ? `${finalTranscript} ${interimTranscript}`
      : finalTranscript
    : interimTranscript

  const charCount = liveTranscript.length
  const wordCount = liveTranscript.trim() ? liveTranscript.trim().split(/\s+/).length : 0

  return {
    transcript: finalTranscript, // Primary finalized transcript
    finalTranscript,
    interimTranscript,
    liveTranscript,
    isListening,
    isSpeaking,
    isSupported,
    permissionStatus,
    error,
    charCount,
    wordCount,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
    requestMicrophonePermission,
  }
}
