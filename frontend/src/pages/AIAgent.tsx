import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Trash2,
  Search,
  CheckCircle2,
  ExternalLink,
  Target,
  FileEdit,
  Lightbulb,
  XCircle,
  Copy,
  Check,
  FileText,
} from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useResumeContext } from '@/features/resume/context/ResumeContext'
import { useResume, useResumeDetails, useResumeChat, useJobMatch, useJobMatchStatus } from '@/features/resume/hooks/useResume'
import { ScoreRingContainer } from '@/features/resume/components/ScoreRing'
import { resumeApi } from '@/features/resume/api/resumeApi'
import { cn } from '@/lib/utils'

type AgentTab = 'chat' | 'find_jobs' | 'match_jd'

const SUGGESTED_PROMPTS = [
  'Find Java Backend Developer jobs for me.',
  'Review my career profile and suggest improvements.',
  'Help me prepare for a technical interview.',
  'What skills should I learn to become a better Java developer?',
  'Help me improve my resume for a particular job.',
]

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2.5 rounded-xl border border-border overflow-hidden bg-[#080908] text-[#FAF8F3] shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#141613] border-b border-[#232621] text-[11px] font-mono text-muted-foreground">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1 hover:text-[#FAF8F3] transition-colors cursor-pointer px-1.5 py-0.5 rounded"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#CDF22B]" />
              <span className="text-[#CDF22B]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-foreground/95">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-secondary-bg text-foreground font-mono text-[12px] border border-border"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function TextMarkdown({ text }: { text: string }) {
  if (!text) return null
  const lines = text.split('\n')

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sm text-foreground mt-2 mb-0.5">
              {renderFormattedInline(trimmed.slice(4))}
            </h4>
          )
        }
        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-base text-foreground mt-2.5 mb-1">
              {renderFormattedInline(trimmed.slice(3))}
            </h3>
          )
        }
        // Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-extrabold text-lg text-foreground mt-3 mb-1">
              {renderFormattedInline(trimmed.slice(2))}
            </h2>
          )
        }

        // Bullet point
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-foreground/90">
              <span className="text-[#080908] dark:text-[#CDF22B] font-bold mt-1 text-xs">•</span>
              <span className="flex-1 leading-relaxed">{renderFormattedInline(trimmed.slice(2))}</span>
            </div>
          )
        }

        // Numbered list
        const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (numberMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-foreground/90">
              <span className="font-mono font-bold text-foreground text-xs mt-0.5">
                {numberMatch[1]}.
              </span>
              <span className="flex-1 leading-relaxed">{renderFormattedInline(numberMatch[2])}</span>
            </div>
          )
        }

        return (
          <p key={idx} className="text-foreground/90 leading-relaxed">
            {renderFormattedInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function FormattedMessage({ content }: { content: string }) {
  if (!content) return null

  // Split content by markdown code blocks ```lang\n...```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g
  const segments: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index)
      segments.push(
        <TextMarkdown key={`text-${lastIndex}`} text={textBefore} />
      )
    }
    const lang = match[1] || ''
    const code = match[2] || ''
    segments.push(
      <CodeBlock key={`code-${match.index}`} language={lang} code={code.trimEnd()} />
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push(
      <TextMarkdown key={`text-${lastIndex}`} text={content.substring(lastIndex)} />
    )
  }

  return <div className="space-y-2">{segments}</div>
}

// ─────────────────────────────────────────────────────────────
// 1. CONVERSATIONAL RAG CHAT COMPONENT
// ─────────────────────────────────────────────────────────────

function AgentChatPanel() {
  const navigate = useNavigate()
  const { selectedResumeId } = useResumeContext()
  const { data: resume, isLoading: isResumeLoading } = useResume(selectedResumeId)

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  } = useResumeChat([])

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isLoading])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    sendMessage(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
  }

  const handleSuggestion = (prompt: string) => {
    if (isLoading) return
    sendMessage(prompt)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Status Bar ── */}
      <div className="py-2.5 flex items-center justify-between shrink-0 text-xs border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-semibold text-foreground text-xs sm:text-[13px]">
            Career Agent Session
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            • Grounded Career Guidance & Job Intelligence
          </span>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-secondary-bg"
            title="Clear conversation history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* ── Missing Resume Guidance Banner ── */}
      {!resume && !isResumeLoading && (
        <div className="mt-3 p-3 bg-secondary-bg border border-border rounded-xl flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4 text-foreground shrink-0" />
            <span>Upload or select your resume to unlock personalized career advice grounded in your qualifications.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/resume/upload')}
            className="px-3 py-1 bg-[#080908] dark:bg-[#FAF8F3] text-[#FAF8F3] dark:text-[#080908] font-bold text-xs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer shrink-0"
          >
            Upload Resume
          </button>
        </div>
      )}

      {/* ── Continuous Conversation Scroll Surface ── */}
      <div className="flex-1 overflow-y-auto py-5 space-y-5 scroll-smooth pr-1">
        {messages.length === 0 ? (
          /* Initial Welcome Screen */
          <div className="max-w-2xl mx-auto my-auto py-8 sm:py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#080908] dark:bg-[#CDF22B] text-[#CDF22B] dark:text-[#080908] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Bot className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Career Agent
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-8">
              Hi! I'm your Career Agent. I can help you navigate your career, improve your job search, prepare for interviews, and identify opportunities.
            </p>

            <div className="text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Suggested Prompts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestion(prompt)}
                    disabled={isLoading}
                    className="p-3 text-left text-xs sm:text-[13px] font-medium text-foreground bg-card hover:bg-secondary-bg border border-border hover:border-foreground/20 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group flex items-start justify-between gap-2"
                  >
                    <span className="leading-snug">{prompt}</span>
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversational Messages */
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="group"
              >
                {msg.role === 'user' ? (
                  /* User message */
                  <div className="flex justify-end pl-10">
                    <div className="bg-[#080908] text-[#FAF8F3] dark:bg-[#1E201E] dark:text-[#FAF8F3] border border-transparent dark:border-border rounded-2xl rounded-tr-xs px-4 py-2.5 text-[14px] leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-xs">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className="text-[10px] text-[#FAF8F3]/60 mt-1 text-right font-mono">
                        {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(msg.timestamp))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AI message */
                  <div className="flex items-start gap-3.5 pr-4">
                    <div className="w-8 h-8 rounded-full bg-[#080908] dark:bg-[#CDF22B] text-[#CDF22B] dark:text-[#080908] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="text-[14px] leading-[1.65] text-foreground font-normal bg-card/60 p-4 rounded-2xl rounded-tl-xs border border-border">
                        <FormattedMessage content={msg.content} />
                      </div>

                      {msg.toolTrace && msg.toolTrace.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 pl-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Tool Activity:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {msg.toolTrace.map((tool) => (
                              <span
                                key={tool}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-secondary-bg text-foreground border border-border"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-muted-foreground mt-1 pl-1 font-mono">
                        {new Intl.DateTimeFormat('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        }).format(new Date(msg.timestamp))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Thinking / Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3.5 pr-4"
              >
                <div className="w-8 h-8 rounded-full bg-[#080908] dark:bg-[#CDF22B] text-[#CDF22B] dark:text-[#080908] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="space-y-1.5 py-1">
                  <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Career Agent is thinking...</span>
                  </div>
                  <div className="space-y-1 max-w-xs pt-0.5">
                    <div className="h-2 w-48 bg-secondary-bg rounded-full animate-pulse" />
                    <div className="h-2 w-32 bg-secondary-bg rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive flex items-center gap-2.5">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom Composer ── */}
      <div className="pt-3 pb-1 flex-shrink-0 space-y-2.5 bg-background">
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestion(prompt)}
                disabled={isLoading}
                className="h-7 text-[11px] px-3 rounded-full bg-card border border-border text-foreground hover:bg-secondary-bg transition-all whitespace-nowrap cursor-pointer flex-shrink-0 disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <div className="relative rounded-2xl border border-border bg-card focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground transition-all p-2 sm:p-2.5 flex items-end gap-2 shadow-xs">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Career Agent anything... (Press Enter to send, Shift + Enter for newline)"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent border-0 px-2 py-1.5 text-[13.5px] sm:text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none max-h-36 min-h-[38px] leading-relaxed"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-[#080908] text-[#FAF8F3] dark:bg-[#CDF22B] dark:text-[#080908] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. FIND JOBS MATCHING MY RESUME TASK WORKFLOW
// ─────────────────────────────────────────────────────────────

interface AgentJobItem {
  job_id: string
  title: string
  company: string
  location: string
  work_model?: string
  employment_type?: string
  url?: string
  description?: string
}

function FindMatchingJobsWorkflow() {
  const navigate = useNavigate()
  const { selectedResumeId } = useResumeContext()
  const { data: resume } = useResume(selectedResumeId)
  const { data: details } = useResumeDetails(selectedResumeId)

  const [stage, setStage] = useState<'analyzing' | 'searching' | 'comparing' | 'complete'>('analyzing')
  const [jobs, setJobs] = useState<AgentJobItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const runJobSearchWorkflow = async () => {
      setStage('analyzing')
      setError(null)

      await new Promise((r) => setTimeout(r, 600))
      if (cancelled) return
      setStage('searching')

      try {
        const result = await resumeApi.findJobsForMe({
          location: 'India',
          days: 30,
          limit: 20,
        })
        if (cancelled) return
        setStage('comparing')
        await new Promise((r) => setTimeout(r, 500))

        if (cancelled) return
        setJobs(result?.jobs || [])
        setStage('complete')
      } catch (err: unknown) {
        console.error('[AgentJobSearch] Failed:', err)
        if (!cancelled) {
          setError((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || 'Failed to search matching jobs.')
          setStage('complete')
        }
      }
    }

    runJobSearchWorkflow()
    return () => {
      cancelled = true
    }
  }, [selectedResumeId, details])

  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
      {/* Tool Execution Activity Progress */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-foreground" />
            <h3 className="font-bold text-xs sm:text-sm text-foreground">
              AI Career Agent Activity
            </h3>
          </div>
          {stage !== 'complete' && (
            <span className="flex items-center gap-1 text-[11px] text-foreground font-semibold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> In Progress
            </span>
          )}
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            <span className="text-foreground font-medium">Resume profile analyzed ({resume?.fileName || 'Active resume'})</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {stage === 'analyzing' ? (
              <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            )}
            <span className={cn('font-medium', stage === 'analyzing' ? 'text-foreground font-bold' : 'text-muted-foreground')}>
              Searching active job opportunities
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {stage === 'analyzing' || stage === 'searching' ? (
              <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" />
            ) : stage === 'comparing' ? (
              <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            )}
            <span className={cn('font-medium', stage === 'comparing' ? 'text-foreground font-bold' : stage === 'complete' ? 'text-foreground' : 'text-muted-foreground')}>
              Comparing live job requirements against your resume qualifications
            </span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-card border border-destructive/40 rounded-xl text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {stage === 'complete' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs sm:text-sm text-foreground">
              Matched Opportunities ({jobs.length} found)
            </h3>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-semibold text-foreground underline hover:text-foreground/80 cursor-pointer"
            >
              Open in Job Explorer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jobs.map((job) => (
              <div
                key={job.job_id}
                className="p-3.5 rounded-xl border border-border bg-card hover:border-[#080908] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                        {job.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {job.company} • {job.location}
                      </p>
                    </div>
                    {job.work_model && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary-bg text-muted-foreground border border-border flex-shrink-0">
                        {job.work_model}
                      </span>
                    )}
                  </div>

                  {job.employment_type && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {job.employment_type}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-border text-xs">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-foreground underline hover:text-foreground/80"
                    >
                      <span>View & Apply</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    onClick={() => {
                      if (job.description) {
                        navigate('/agent?task=match_jd', { state: { jdText: job.description } })
                      } else {
                        navigate('/agent?task=match_jd', { state: { jdText: `${job.title} at ${job.company}\nLocation: ${job.location}` } })
                      }
                    }}
                    className="text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                  >
                    Match Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. MATCH MY RESUME TO A JOB DESCRIPTION TASK WORKFLOW
// ─────────────────────────────────────────────────────────────

function MatchJobDescriptionWorkflow({ initialJdText }: { initialJdText?: string }) {
  const navigate = useNavigate()
  const { selectedResumeId } = useResumeContext()
  const { data: resume } = useResume(selectedResumeId)

  const [jobDescription, setJobDescription] = useState(initialJdText || '')
  const [activeMatchId, setActiveMatchId] = useState<string | undefined>()

  const jobMatchMutation = useJobMatch()
  const jobMatchStatusQuery = useJobMatchStatus(resume?.id, activeMatchId)
  const status = jobMatchStatusQuery.data?.status
  const isProcessing = Boolean(activeMatchId) && status !== 'COMPLETED' && status !== 'FAILED'

  const handleMatch = () => {
    const cleaned = jobDescription.trim()
    if (!cleaned || !resume?.id || isProcessing || jobMatchMutation.isPending) return

    setActiveMatchId(undefined)
    jobMatchMutation.mutate(
      {
        input: { description: cleaned },
        resumeId: resume.id,
      },
      {
        onSuccess: (data) => {
          setActiveMatchId(data.matchId)
        },
      }
    )
  }

  const result = status === 'COMPLETED' ? jobMatchStatusQuery.data : undefined

  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
      {/* JD Input Area */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-foreground">
            Target Job Description
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Paste the full job posting text to analyze skill gaps and keyword alignment against your resume.
          </p>
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description requirements, responsibilities, and qualifications here..."
          rows={5}
          disabled={isProcessing || jobMatchMutation.isPending}
          className="w-full p-3 text-xs sm:text-sm bg-secondary-bg/60 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#080908] focus:border-[#080908] text-foreground leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
            {jobDescription.length} characters
          </span>

          <button
            onClick={handleMatch}
            disabled={!jobDescription.trim() || !resume?.id || isProcessing || jobMatchMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CDF22B] hover:bg-[#b8da25] disabled:opacity-40 disabled:cursor-not-allowed text-[#080908] font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            {isProcessing || jobMatchMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#080908] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Evaluating Match...</span>
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                <span>Analyze Match</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Progress State */}
      {(isProcessing || jobMatchMutation.isPending) && (
        <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-foreground animate-pulse" />
              <span className="text-xs font-bold text-foreground">
                Comparing resume against job requirements...
              </span>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">Analyzing skills</span>
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-secondary-bg rounded animate-pulse" />
            <div className="h-3.5 w-4/5 bg-secondary-bg rounded animate-pulse" />
            <div className="h-3.5 w-3/5 bg-secondary-bg rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Match Results Panel */}
      {result && (
        <div className="space-y-3.5">
          {/* Top Overall Score Card */}
          <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <ScoreRingContainer score={result.overallMatch ?? 0} size="lg" label="Match" color="#080908" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Match Compatibility</span>
                <h3 className="font-extrabold text-lg text-foreground">
                  {result.overallMatch}% Overall Fit
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(result.overallMatch ?? 0) >= 75
                    ? 'Strong alignment with key requirements.'
                    : 'Moderate alignment with noticeable skill gaps.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/resume/builder')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CDF22B] hover:bg-[#b8da25] text-[#080908] font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Improve Resume for This Job</span>
            </button>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Matched */}
            <div className="p-3.5 bg-card border border-border rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />
                <span>Strong Matches ({result.matchedSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-bg border border-border text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing */}
            <div className="p-3.5 bg-card border border-border rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Missing / Weak Areas ({result.missingSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missingSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary-bg/60 border border-border text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-3.5 bg-card border border-border rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Lightbulb className="w-3.5 h-3.5 text-foreground" />
                <span>Recommended Improvements</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-foreground mt-1 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN AI CAREER AGENT PAGE (Single Continuous Workspace)
// ─────────────────────────────────────────────────────────────

function AIAgentInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTask = searchParams.get('task') || (location.state?.jdText ? 'match_jd' : 'chat')
  const [activeTab, setActiveTab] = useState<AgentTab>(() => {
    if (initialTask === 'find_jobs') return 'find_jobs'
    if (initialTask === 'match_jd') return 'match_jd'
    return 'chat'
  })

  const jdTextState = location.state?.jdText

  useEffect(() => {
    const task = searchParams.get('task')
    if (task === 'find_jobs') setActiveTab('find_jobs')
    else if (task === 'match_jd') setActiveTab('match_jd')
  }, [searchParams])

  const setTabWithUrl = (tab: AgentTab) => {
    setActiveTab(tab)
    if (tab === 'chat') {
      setSearchParams({})
    } else {
      setSearchParams({ task: tab })
    }
  }

  return (
    <div className="flex-1 w-full min-w-0 flex flex-col h-full min-h-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
      {/* ── Page Header ── */}
      <div className="pb-3 border-b border-border flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-extrabold text-2xl sm:text-[26px] text-foreground tracking-tight leading-tight">
              Career Agent
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
          <p className="text-[13px] sm:text-[13.5px] text-muted-foreground leading-normal">
            Your AI-powered career assistant.
          </p>
        </div>

        {/* ── Contextual Action Chips Row ── */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3.5 pb-1 scrollbar-none flex-wrap">
          <button
            onClick={() => setTabWithUrl('chat')}
            className={cn(
              'h-9.5 inline-flex items-center gap-2 px-4 text-[13px] rounded-full transition-all cursor-pointer whitespace-nowrap border shadow-xs',
              activeTab === 'chat'
                ? 'bg-[#080908] text-[#CDF22B] border-[#080908] font-bold shadow-xs'
                : 'bg-card text-foreground border-border hover:bg-secondary-bg font-medium'
            )}
          >
            <Bot className="w-4 h-4" />
            <span>Ask About My Career</span>
          </button>

          <button
            onClick={() => setTabWithUrl('find_jobs')}
            className={cn(
              'h-9.5 inline-flex items-center gap-2 px-4 text-[13px] rounded-full transition-all cursor-pointer whitespace-nowrap border shadow-xs',
              activeTab === 'find_jobs'
                ? 'bg-[#080908] text-[#CDF22B] border-[#080908] font-bold shadow-xs'
                : 'bg-card text-foreground border-border hover:bg-secondary-bg font-medium'
            )}
          >
            <Search className="w-4 h-4" />
            <span>Find Jobs Matching My Resume</span>
          </button>

          <button
            onClick={() => setTabWithUrl('match_jd')}
            className={cn(
              'h-9.5 inline-flex items-center gap-2 px-4 text-[13px] rounded-full transition-all cursor-pointer whitespace-nowrap border shadow-xs',
              activeTab === 'match_jd'
                ? 'bg-[#080908] text-[#CDF22B] border-[#080908] font-bold shadow-xs'
                : 'bg-card text-foreground border-border hover:bg-secondary-bg font-medium'
            )}
          >
            <Target className="w-4 h-4" />
            <span>Match Resume to Job Description</span>
          </button>

          <button
            onClick={() => navigate('/resume/builder')}
            className="h-9.5 inline-flex items-center gap-2 px-4 text-[13px] font-semibold rounded-full bg-card text-foreground border border-border hover:bg-secondary-bg transition-all cursor-pointer whitespace-nowrap shadow-xs sm:ml-auto"
          >
            <FileEdit className="w-4 h-4 text-foreground" />
            <span>Improve My Resume</span>
          </button>
        </div>
      </div>

      {/* ── Active Task View (Chat / Job Search / JD Match) ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'chat' && <AgentChatPanel />}
        {activeTab === 'find_jobs' && <FindMatchingJobsWorkflow />}
        {activeTab === 'match_jd' && <MatchJobDescriptionWorkflow initialJdText={jdTextState} />}
      </div>
    </div>
  )
}

export default function AIAgent() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-0px)] overflow-hidden bg-background">
      <AIAgentInner />
    </div>
  )
}
