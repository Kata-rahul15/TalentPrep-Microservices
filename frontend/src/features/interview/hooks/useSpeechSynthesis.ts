import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseSpeechSynthesisResult {
  speak: (text: string, questionId?: string, forceRepeat?: boolean, onEndCallback?: () => void) => void
  cancel: () => void
  replay: (text: string, questionId?: string) => void
  unlockAudio: () => void
  isSpeaking: boolean
  isSupported: boolean
  lastSpokenQuestionId: string | null
}

interface SpeechQueueItem {
  id: string
  text: string
  onStart?: () => void
  onEnd?: () => void
}

/**
 * Clean markdown and syntax tokens so browser TTS speaks natural, fluid English dialogue
 */
function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return ''
  return rawText
    // Replace code blocks with a brief natural phrasing
    .replace(/```[a-zA-Z0-9]*\n?([\s\S]*?)```/g, 'Refer to the code displayed on your screen.')
    // Remove inline backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown bold/italics
    .replace(/(\*\*|\*|__|_)(.*?)\1/g, '$2')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet points / markdown headers
    .replace(/^[#*>-]\s+/gm, '')
    // Normalize excessive whitespace & newlines to a natural pause
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function useSpeechSynthesis(
  onEnd?: () => void,
  onStart?: () => void
): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastSpokenQuestionId, setLastSpokenQuestionId] = useState<string | null>(null)

  const onEndRef = useRef(onEnd)
  const onStartRef = useRef(onStart)
  const fallbackTimeoutRef = useRef<number | null>(null)

  // Internal FIFO speech queue
  const queueRef = useRef<SpeechQueueItem[]>([])
  const isProcessingQueueRef = useRef(false)
  const spokenIdsRef = useRef<Set<string>>(new Set())
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    onEndRef.current = onEnd
    onStartRef.current = onStart
  }, [onEnd, onStart])

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Populate voices
  const populateVoices = useCallback(() => {
    if (!isSupported) return
    try {
      const available = window.speechSynthesis.getVoices()
      if (available && available.length > 0) {
        voicesRef.current = available
      }
    } catch {
      // Ignore
    }
  }, [isSupported])

  // Select best available professional female English voice consistently
  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length > 0 ? voicesRef.current : (isSupported ? window.speechSynthesis.getVoices() : [])
    if (!voices || voices.length === 0) return null

    // 1. Prioritize natural, professional female English voices
    const preferredFemaleVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Samantha') ||
          v.name.includes('Jenny') ||
          v.name.includes('Victoria') ||
          v.name.includes('Zira') ||
          v.name.includes('Karen') ||
          v.name.includes('Female') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Microsoft Jenny') ||
          v.name.includes('Microsoft Zira') ||
          v.name.includes('Google US English'))
    )
    if (preferredFemaleVoice) return preferredFemaleVoice

    // 2. Fall back to natural/premium English voices
    return (
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Premium') ||
            v.lang === 'en-US' ||
            v.lang === 'en-GB' ||
            v.lang === 'en-IN')
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0] ||
      null
    )
  }, [isSupported])

  // Cancel all ongoing and queued speech
  const cancel = useCallback(() => {
    if (fallbackTimeoutRef.current !== null) {
      window.clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }

    queueRef.current = []
    isProcessingQueueRef.current = false
    activeUtteranceRef.current = null

    if (isSupported) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Ignore cancellation errors
      }
    }
    setIsSpeaking(false)
  }, [isSupported])

  // Process next item in the speech queue
  const processNextInQueue = useCallback(() => {
    if (!isSupported) {
      queueRef.current = []
      isProcessingQueueRef.current = false
      setIsSpeaking(false)
      onEndRef.current?.()
      return
    }

    if (queueRef.current.length === 0) {
      isProcessingQueueRef.current = false
      activeUtteranceRef.current = null
      setIsSpeaking(false)
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }
      onEndRef.current?.()
      return
    }

    isProcessingQueueRef.current = true
    const currentItem = queueRef.current[0]
    const spokenText = cleanTextForSpeech(currentItem.text)

    if (!spokenText) {
      // Nothing to speak, advance queue
      queueRef.current.shift()
      processNextInQueue()
      return
    }

    try {
      // Resume if browser synthesis is paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance = new SpeechSynthesisUtterance(spokenText)
      utterance.lang = 'en-US'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      const voice = getPreferredVoice()
      if (voice) {
        utterance.voice = voice
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        if (currentItem.id) {
          setLastSpokenQuestionId(currentItem.id)
        }
        currentItem.onStart?.()
        onStartRef.current?.()
      }

      utterance.onend = () => {
        // Ignore completion events for utterances invalidated by cancel/replay.
        if (activeUtteranceRef.current !== utterance) return
        if (fallbackTimeoutRef.current !== null) {
          window.clearTimeout(fallbackTimeoutRef.current)
          fallbackTimeoutRef.current = null
        }
        currentItem.onEnd?.()
        queueRef.current.shift()
        // Seamlessly advance to the next queued item (e.g. Greeting -> Question 1)
        processNextInQueue()
      }

      utterance.onerror = (e) => {
        // cancel() invalidates the active utterance before browser cancellation callbacks fire.
        if (activeUtteranceRef.current !== utterance) return
        console.warn('[useSpeechSynthesis] utterance.onerror:', e)
        if (fallbackTimeoutRef.current !== null) {
          window.clearTimeout(fallbackTimeoutRef.current)
          fallbackTimeoutRef.current = null
        }
        currentItem.onEnd?.()
        queueRef.current.shift()
        processNextInQueue()
      }

      // Keep active reference to prevent Chromium garbage collection of utterance
      activeUtteranceRef.current = utterance

      // Safety fallback timer: prevents conversation freezing if browser silently drops utterance
      const estimatedDurationMs = Math.max(4000, (spokenText.length / 14) * 1000)
      fallbackTimeoutRef.current = window.setTimeout(() => {
        if (activeUtteranceRef.current !== utterance) return
        console.warn('[useSpeechSynthesis] Speech watchdog triggered; releasing stalled utterance and advancing queue')
        activeUtteranceRef.current = null
        try { window.speechSynthesis.cancel() } catch {}
        if (queueRef.current.length > 0 && queueRef.current[0].id === currentItem.id) {
          queueRef.current.shift()
        }
        processNextInQueue()
      }, estimatedDurationMs + 8000)

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.warn('[useSpeechSynthesis] speak error:', err)
      queueRef.current.shift()
      processNextInQueue()
    }
  }, [isSupported, getPreferredVoice])

  // Explicit audio unlock trigger for browser autoplay policies
  const unlockAudio = useCallback(() => {
    if (!isSupported) return
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      populateVoices()
    } catch {
      // Ignore
    }
  }, [isSupported, populateVoices])

  // Enqueue a spoken message with optional completion callback
  const speak = useCallback(
    (text: string, questionId?: string, forceRepeat = false, onEndCallback?: () => void) => {
      if (!isSupported) {
        onEndCallback?.()
        onEndRef.current?.()
        return
      }

      const msgId = questionId || text.trim()

      // Deduplicate: prevent speaking identical message repeatedly unless forced
      if (msgId && spokenIdsRef.current.has(msgId) && !forceRepeat) {
        onEndCallback?.()
        return
      }

      if (msgId) {
        spokenIdsRef.current.add(msgId)
      }

      if (!text || text.trim() === '') {
        onEndCallback?.()
        onEndRef.current?.()
        return
      }

      // Check if message is already in queue
      const isAlreadyQueued = queueRef.current.some((item) => item.id === msgId)
      if (isAlreadyQueued && !forceRepeat) {
        return
      }

      // Enqueue speech item
      queueRef.current.push({
        id: msgId,
        text,
        onEnd: onEndCallback,
      })

      // If not currently processing queue, start immediately
      if (!isProcessingQueueRef.current) {
        processNextInQueue()
      }
    },
    [isSupported, processNextInQueue]
  )

  const replay = useCallback(
    (text: string, questionId?: string) => {
      cancel()
      speak(text, questionId, true)
    },
    [cancel, speak]
  )

  // Initialize voices and listen for dynamic voice list availability in Chromium
  useEffect(() => {
    if (!isSupported) return
    populateVoices()

    const handleVoicesChanged = () => {
      populateVoices()
    }

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    try {
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged
    } catch {}

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      try {
        if (window.speechSynthesis.onvoiceschanged === handleVoicesChanged) {
          window.speechSynthesis.onvoiceschanged = null
        }
      } catch {}
      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current)
      }
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Ignore
      }
    }
  }, [isSupported, populateVoices])

  return {
    speak,
    cancel,
    replay,
    unlockAudio,
    isSpeaking,
    isSupported,
    lastSpokenQuestionId,
  }
}
