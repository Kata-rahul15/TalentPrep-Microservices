import { useRef, useEffect } from 'react'
import { Send, Mic, MicOff, AlertCircle } from 'lucide-react'

interface InterviewInputBarProps {
  inputText: string
  onChangeInput: (text: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  isThinking?: boolean
  // Voice states
  isListening?: boolean
  isCandidateSpeaking?: boolean
  onStartListening: () => void
  onStopListening: () => void
  isSttSupported?: boolean
  errorMessage?: string | null
  className?: string
}

export default function InterviewInputBar({
  inputText,
  onChangeInput,
  onSubmit,
  isSubmitting = false,
  isThinking = false,
  isListening = false,
  isCandidateSpeaking = false,
  onStartListening,
  onStopListening,
  isSttSupported = true,
  errorMessage,
  className = '',
}: InterviewInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when not thinking or submitting
  useEffect(() => {
    if (!isThinking && !isSubmitting && !isListening && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isThinking, isSubmitting, isListening])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (inputText.trim() && !isSubmitting && !isThinking) {
        onSubmit()
      }
    }
  }

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0
  const charCount = inputText.length

  return (
    <div className={`p-4 bg-card border-t border-border space-y-3 ${className}`}>
      {/* ── Error Notice if any ── */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Active Speech Recording Waveform Bar ── */}
      {isListening && (
        <div className="px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Microphone Active — Speak now (transcribing live)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-mono">
              <span className={`w-0.5 ${isCandidateSpeaking ? 'h-3 animate-bounce' : 'h-1.5'} bg-white rounded-full`} />
              <span className={`w-0.5 ${isCandidateSpeaking ? 'h-4 animate-bounce [animation-delay:100ms]' : 'h-2'} bg-white rounded-full`} />
              <span className={`w-0.5 ${isCandidateSpeaking ? 'h-2.5 animate-bounce [animation-delay:200ms]' : 'h-1.5'} bg-white rounded-full`} />
              <span className="ml-1 font-bold">{isCandidateSpeaking ? 'TALKING' : 'LISTENING'}</span>
            </div>

            <button
              type="button"
              onClick={onStopListening}
              className="px-2.5 py-1 rounded-md bg-card hover:bg-secondary-bg border border-border text-[11px] font-semibold text-foreground transition-colors cursor-pointer"
            >
              Pause Mic
            </button>
          </div>
        </div>
      )}

      {/* ── Multiline Input Textarea ── */}
      <div className="relative rounded-xl border border-border bg-secondary-bg/40 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => onChangeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting || isThinking}
          rows={3}
          placeholder="Speak or type your answer here... Structure your response with technical rationale, decisions, and trade-offs."
          className="w-full p-3.5 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed"
        />

        {/* Bottom Toolbar inside input */}
        <div className="px-3 py-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-mono tabular-nums">
              {wordCount} words • {charCount} chars
            </span>
            <span className="hidden sm:inline text-muted-foreground/80">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-foreground">Ctrl+Enter</kbd> to submit
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Input */}
            {inputText && (
              <button
                type="button"
                onClick={() => onChangeInput('')}
                disabled={isSubmitting || isThinking}
                className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            {/* Microphone Toggle Button */}
            {isSttSupported && (
              <button
                type="button"
                onClick={isListening ? onStopListening : onStartListening}
                disabled={isSubmitting || isThinking}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-card hover:bg-secondary-bg border border-border text-foreground'
                }`}
                title={isListening ? 'Stop microphone dictation' : 'Start speaking your answer'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Stop Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                    <span>Speak</span>
                  </>
                )}
              </button>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!inputText.trim() || isSubmitting || isThinking}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : isThinking ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
