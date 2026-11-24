import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  MessageSquare,
  Trash2,
  Bot,
  User,
  Loader2,
} from 'lucide-react'

import { useResumeChat } from '../hooks/useResume'
import { cn } from '@/lib/utils'

const SUGGESTED_PROMPTS = [
  'Summarize my resume.',
  'What are my strongest technical skills?',
  'Which skills are missing from my resume?',
  'Explain my project experience.',
  'How can I improve my professional summary?',
  'Which achievements need better quantification?',
  'How well does my resume fit a backend developer role?',
]

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }

    const lines = part.split('\n')

    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < lines.length - 1 && <br />}
      </span>
    ))
  })
}

export default function ResumeChat() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  } = useResumeChat()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    sendMessage(trimmedInput)
    setInput('')
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (question: string) => {
    if (isLoading) return
    sendMessage(question)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[700px] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-heading font-black text-lg sm:text-xl text-foreground leading-tight">
            Resume Chat
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            Ask AI anything about your resume
          </p>
        </div>

        <button
          onClick={clearHistory}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-danger transition-colors px-2.5 py-1 rounded-lg hover:bg-danger/10 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Chat container */}
      <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-2xs">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    msg.role === 'user'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary-bg border border-border text-muted-foreground'
                  )}
                >
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message */}
                <div
                  className={cn(
                    'max-w-[80%] px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-xs'
                      : 'bg-secondary-bg/50 border border-border text-secondary-foreground rounded-tl-xs'
                  )}
                >
                  {renderMarkdown(msg.content)}

                  {msg.role === 'assistant' && msg.toolTrace && msg.toolTrace.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/60">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-primary mb-1">Tools used</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.toolTrace.map((tool) => (
                          <span key={tool} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-medium">{tool}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p
                    className={cn(
                      'text-[9px] mt-1',
                      msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground'
                    )}
                  >
                    {new Intl.DateTimeFormat('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(msg.timestamp))}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-secondary-bg border border-border text-muted-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-3 py-2 bg-secondary-bg/50 border border-border rounded-xl rounded-tl-xs flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="p-2.5 bg-danger/5 border border-danger/20 rounded-lg text-xs text-danger">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-divider">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Suggested Questions
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {SUGGESTED_PROMPTS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  disabled={isLoading}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-secondary-bg border border-border text-secondary-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-divider p-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your resume... (Enter to send)"
                rows={1}
                className="w-full resize-none bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all leading-relaxed min-h-[38px] max-h-24"
                disabled={isLoading}
                aria-label="Chat message input"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-1.5">
            <MessageSquare className="w-3 h-3 inline mr-1" />
            Press <kbd className="px-1 py-0.2 bg-secondary-bg border border-border rounded text-[9px]">Enter</kbd> to send, <kbd className="px-1 py-0.2 bg-secondary-bg border border-border rounded text-[9px]">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  )
}
