import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bot,
  User,
  Copy,
  Check,
  Clock,
  FileCode,
} from 'lucide-react'
import type { ConversationMessage } from '../../types/interview.types'

interface InterviewConversationProps {
  messages: ConversationMessage[]
  interimTranscript?: string
  isCandidateSpeaking?: boolean
  isThinking?: boolean
  thinkingMessage?: string
  candidateName?: string
  interviewerName?: string
  className?: string
}

function FormattedContent({ text }: { text: string }) {
  if (!text) return null

  // Check if text contains code blocks with ```
  const codeBlockRegex = /```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const preText = text.slice(lastIndex, match.index)
    if (preText) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {preText}
        </span>
      )
    }

    const language = match[1] || 'code'
    const codeContent = match[2]
    parts.push(
      <CodeSnippetBlock key={`code-${match.index}`} language={language} code={codeContent} />
    )

    lastIndex = match.index + match[0].length
  }

  const remaining = text.slice(lastIndex)
  if (remaining) {
    parts.push(
      <span key={`text-end`} className="whitespace-pre-wrap leading-relaxed">
        {remaining}
      </span>
    )
  }

  return <div className="space-y-2">{parts}</div>
}

function CodeSnippetBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border my-2.5 bg-slate-950 text-slate-100 font-mono text-xs shadow-xs">
      <div className="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>{language || 'code'}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed custom-scrollbar whitespace-pre">
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}

export default function InterviewConversation({
  messages,
  interimTranscript = '',
  isCandidateSpeaking: _isCandidateSpeaking = false,
  isThinking = false,
  thinkingMessage = 'Evaluating response and preparing next question...',
  candidateName = 'You',
  interviewerName = 'Interviewer',
  className = '',
}: InterviewConversationProps) {
  const bottomAnchorRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new message or thinking state
  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isThinking, interimTranscript])

  return (
    <div
      className={`flex-1 w-full overflow-y-auto px-4 sm:px-6 py-5 space-y-5 custom-scrollbar ${className}`}
    >
      {/* ── Message Thread ── */}
      {messages.map((msg) => {
        const isAI = msg.sender === 'ai'
        const isSystem = msg.sender === 'system'

        if (isSystem) {
          return (
            <div key={msg.id} className="flex items-center justify-center my-3">
              <span className="px-3 py-1 rounded-full bg-secondary-bg border border-border text-[11px] font-mono text-muted-foreground">
                {msg.text}
              </span>
            </div>
          )
        }

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 w-full ${
              isAI ? 'justify-start' : 'justify-end'
            }`}
          >
            {/* AI Avatar Icon */}
            {isAI && (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            {/* Message Bubble Card */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                isAI
                  ? 'bg-card border border-border text-foreground'
                  : 'bg-blue-600 text-white border border-blue-500 shadow-sm'
              }`}
            >
              {/* Header Info Bar */}
              <div
                className={`flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b text-xs ${
                  isAI
                    ? 'border-border/70 text-muted-foreground'
                    : 'border-blue-500/60 text-blue-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs">
                    {isAI ? interviewerName : candidateName}
                  </span>

                  {isAI && msg.topic && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary-bg border border-border text-foreground">
                      {msg.topic}
                    </span>
                  )}

                  {isAI && msg.isFollowUp && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Follow-up {msg.depth ? `(depth ${msg.depth})` : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-mono text-[10px] tabular-nums opacity-80">
                  <Clock className="w-3 h-3" />
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {/* Message Content */}
              <div
                className={`text-xs sm:text-sm leading-relaxed ${
                  isAI ? 'text-foreground' : 'text-white'
                }`}
              >
                <FormattedContent text={msg.text} />
              </div>
            </div>

            {/* Candidate Avatar Icon */}
            {!isAI && (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        )
      })}

      {/* ── Live Interim Dictation Stream (Temporary Candidate Speech) ── */}
      {interimTranscript && (
        <div className="flex items-start justify-end gap-3 w-full animate-fade-in">
          <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 bg-blue-500/15 border border-blue-400/40 text-foreground shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="text-[11px] uppercase tracking-wider">Live Speech Transcribing</span>
            </div>
            <p className="text-xs sm:text-sm italic text-foreground leading-relaxed">
              "{interimTranscript}"
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
            <User className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* ── AI Thinking / Evaluating Animation Strip ── */}
      {isThinking && (
        <div className="flex items-start gap-3 w-full animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
            <Bot className="w-4 h-4" />
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3 max-w-[85%] sm:max-w-[75%]">
            <div className="flex items-center gap-1 px-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:300ms]" />
            </div>

            <div className="text-xs">
              <p className="font-semibold text-foreground">{thinkingMessage}</p>
              <p className="text-[11px] text-muted-foreground">
                Analyzing technical depth, trade-offs, and formulating response...
              </p>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomAnchorRef} />
    </div>
  )
}
