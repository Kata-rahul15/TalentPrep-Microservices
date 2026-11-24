import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseSpeechSynthesisResult {
  speak: (text: string, questionId?: string, forceRepeat?: boolean) => void
  cancel: () => void
  replay: (text: string, questionId?: string) => void
  isSpeaking: boolean
  isSupported: boolean
  lastSpokenQuestionId: string | null
}

export function useSpeechSynthesis(
  onEnd?: () => void,
  onStart?: () => void
): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const lastSpokenQuestionIdRef = useRef<string | null>(null)
  const [lastSpokenQuestionId, setLastSpokenQuestionId] = useState<string | null>(null)
  const onEndRef = useRef(onEnd)
  const onStartRef = useRef(onStart)
  const fallbackTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    onEndRef.current = onEnd
    onStartRef.current = onStart
  }, [onEnd, onStart])

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const cancel = useCallback(() => {
    if (fallbackTimeoutRef.current !== null) {
      window.clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }

    if (isSupported) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Ignore cancellation errors
      }
    }
    setIsSpeaking(false)
  }, [isSupported])

  const speak = useCallback(
    (text: string, questionId?: string, forceRepeat = false) => {
      if (!isSupported) {
        if (onEndRef.current) {
          onEndRef.current()
        }
        return
      }

      // Prevent speaking identical questionId repeatedly unless explicitly requested
      if (questionId && lastSpokenQuestionIdRef.current === questionId && !forceRepeat) {
        return
      }

      cancel()

      if (!text || text.trim() === '') {
        if (onEndRef.current) {
          onEndRef.current()
        }
        return
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text.trim())
        utterance.lang = 'en-US'
        utterance.rate = 1.0
        utterance.pitch = 1.0

        // Select best available English voice
        const voices = window.speechSynthesis.getVoices()
        if (voices && voices.length > 0) {
          const preferredVoice = voices.find(
            (v) =>
              (v.lang.startsWith('en') &&
                (v.name.includes('Google') ||
                  v.name.includes('Natural') ||
                  v.name.includes('Premium') ||
                  v.lang === 'en-IN')) ||
              v.lang === 'en-US' ||
              v.lang === 'en-GB'
          )
          if (preferredVoice) {
            utterance.voice = preferredVoice
          }
        }

        utterance.onstart = () => {
          setIsSpeaking(true)
          if (questionId) {
            lastSpokenQuestionIdRef.current = questionId
            setLastSpokenQuestionId(questionId)
          }
          if (onStartRef.current) {
            onStartRef.current()
          }
        }

        utterance.onend = () => {
          if (fallbackTimeoutRef.current !== null) {
            window.clearTimeout(fallbackTimeoutRef.current)
            fallbackTimeoutRef.current = null
          }
          setIsSpeaking(false)
          if (onEndRef.current) {
            onEndRef.current()
          }
        }

        utterance.onerror = (e) => {
          console.warn('[useSpeechSynthesis] utterance.onerror:', e)
          if (fallbackTimeoutRef.current !== null) {
            window.clearTimeout(fallbackTimeoutRef.current)
            fallbackTimeoutRef.current = null
          }
          setIsSpeaking(false)
          if (onEndRef.current) {
            onEndRef.current()
          }
        }

        // Safety fallback timer: if browser autoplay policies silently pause or drop speech,
        // unlock the interview room so candidate can proceed after estimated duration
        const estimatedDurationMs = Math.max(5000, Math.min(30000, (text.length / 15) * 1000))
        fallbackTimeoutRef.current = window.setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            // Still speaking normally
            return
          }
          setIsSpeaking(false)
          if (onEndRef.current) {
            onEndRef.current()
          }
        }, estimatedDurationMs)

        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.warn('[useSpeechSynthesis] speak failed:', err)
        setIsSpeaking(false)
        if (onEndRef.current) {
          onEndRef.current()
        }
      }
    },
    [isSupported, cancel]
  )

  const replay = useCallback(
    (text: string, questionId?: string) => {
      speak(text, questionId, true)
    },
    [speak]
  )

  // Listen for dynamic voice list availability in Chromium
  useEffect(() => {
    if (!isSupported) return
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices()
    }
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current)
      }
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Ignore
      }
    }
  }, [isSupported])

  return {
    speak,
    cancel,
    replay,
    isSpeaking,
    isSupported,
    lastSpokenQuestionId,
  }
}
