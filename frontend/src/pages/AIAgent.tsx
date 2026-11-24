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
} from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useResumeContext } from '@/features/resume/context/ResumeContext'
import { useResume, useResumeDetails, useResumeChat, useJobMatch, useJobMatchStatus } from '@/features/resume/hooks/useResume'
import { ScoreRingContainer } from '@/features/resume/components/ScoreRing'
import { resumeApi } from '@/features/resume/api/resumeApi'
import { cn } from '@/lib/utils'

type AgentTab = 'chat' | 'find_jobs' | 'match_jd'

function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[12px] border border-slate-200/60 dark:border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function renderMarkdown(text: string) {
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
            <h4 key={idx} className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-2 mb-0.5">
              {renderFormattedInline(trimmed.slice(4))}
            </h4>
          )
        }
        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-heading font-extrabold text-base text-slate-900 dark:text-white mt-2.5 mb-1">
              {renderFormattedInline(trimmed.slice(3))}
            </h3>
          )
        }

        // Bullet point
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-slate-700 dark:text-slate-200">
              <span className="text-blue-500 font-bold mt-1 text-xs">•</span>
              <span className="flex-1 leading-relaxed">{renderFormattedInline(trimmed.slice(2))}</span>
            </div>
          )
        }

        // Numbered list
        const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (numberMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                {numberMatch[1]}.
              </span>
              <span className="flex-1 leading-relaxed">{renderFormattedInline(numberMatch[2])}</span>
            </div>
          )
        }

        return (
          <p key={idx} className="text-slate-700 dark:text-slate-200 leading-relaxed">
            {renderFormattedInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 1. CONVERSATIONAL RAG CHAT COMPONENT (Clean Continuous Workspace)
// ─────────────────────────────────────────────────────────────
// function AgentChatPanel() {
//   const { messages, isLoading, error, sendMessage, clearHistory } = useResumeChat()
//   const [input, setInput] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const inputRef = useRef<HTMLTextAreaElement>(null)

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages, isLoading])

//   const handleSend = () => {
//     const trimmed = input.trim()
//     if (!trimmed || isLoading) return
//     sendMessage(trimmed)
//     setInput('')
//     requestAnimationFrame(() => {
//       inputRef.current?.focus()
//     })
//   }

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault()
//       handleSend()
//     }
//   }

//   const starterPrompts = [
//     'Analyze my resume & top skills',
//     'Interview questions for my background',
//     'Improve my ATS score',
//     'Add architecture & leadership keywords',
//   ]

//   return (
//     <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
//       {/* ── Status & Clear Chat Sub-row ── */}
//       <div className="pt-3 pb-3 flex items-center justify-between flex-shrink-0 text-xs border-b border-slate-200/70 dark:border-slate-800/70">
//         <div className="flex items-center gap-2.5">
//           <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
//           <span className="font-bold text-slate-900 dark:text-slate-100 text-[12.5px]">
//             TalentPrep Grounded AI Assistant
//           </span>
//           <span className="text-[12px] text-slate-400 font-normal">
//             • Powered by Resume RAG + PGVector
//           </span>
//         </div>

//         <button
//           onClick={clearHistory}
//           className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer py-0.5 px-2 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
//           title="Clear conversation history"
//         >
//           <Trash2 className="w-3.5 h-3.5" />
//           <span>Clear Chat</span>
//         </button>
//       </div>

//       {/* ── Continuous Conversation Scroll Surface ── */}
//       <div className="flex-1 overflow-y-auto py-5 space-y-5 scroll-smooth pr-1">
//         <AnimatePresence initial={false}>
//           {messages.map((msg) => (
//             <motion.div
//               key={msg.id}
//               initial={{ opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.16 }}
//               className="group"
//             >
//               {msg.role === 'user' ? (
//                 /* USER MESSAGE: Compact right-aligned tinted bubble */
//                 <div className="flex justify-end pl-10">
//                   <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-[14px] leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-2xs">
//                     <p className="whitespace-pre-wrap">{msg.content}</p>
//                     <div className="text-[10px] text-blue-200 mt-1 text-right">
//                       {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(msg.timestamp))}
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 /* AI MESSAGE: Clean natural prose with circular avatar */
//                 <div className="flex items-start gap-3.5 pr-4">
//                   <div className="w-7 h-7 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
//                     <Bot className="w-4 h-4" />
//                   </div>

//                   <div className="flex-1 min-w-0 space-y-1.5">
//                     <div className="text-[14.5px] leading-[1.65] text-slate-800 dark:text-slate-100 font-normal">
//                       {renderMarkdown(msg.content)}
//                     </div>

//                     {msg.toolTrace && msg.toolTrace.length > 0 && (
//                       <div className="flex items-center gap-1.5 pt-1">
//                         <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
//                           Tool Activity:
//                         </span>
//                         <div className="flex flex-wrap gap-1">
//                           {msg.toolTrace.map((tool) => (
//                             <span
//                               key={tool}
//                               className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50"
//                             >
//                               {tool}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <div className="text-[11px] text-slate-400 mt-1.5">
//                       {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(msg.timestamp))}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </motion.div>
//           ))}

//           {/* Reasoning / Thinking state */}
//           {isLoading && (
//             <motion.div
//               initial={{ opacity: 0, y: 4 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="flex items-start gap-3.5 pr-4"
//             >
//               <div className="w-7 h-7 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
//                 <Sparkles className="w-4 h-4 animate-pulse" />
//               </div>
//               <div className="space-y-1.5 py-0.5">
//                 <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
//                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
//                   <span>TalentPrep Copilot is reasoning...</span>
//                 </div>
//                 <div className="space-y-1 max-w-xs pt-0.5">
//                   <div className="h-2 w-52 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
//                   <div className="h-2 w-36 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {error && (
//           <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-600 flex items-center gap-2">
//             <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
//             <span>{error}</span>
//           </div>
//         )}

//         <div ref={messagesEndRef} />
//       </div>

//       {/* ── Bottom Fixed Input & Suggested Questions (Anchored near bottom) ── */}
//       <div className="pt-2 pb-5 flex-shrink-0 space-y-2.5 bg-[#FAFBFC] dark:bg-slate-950">
//         {/* Suggested Questions Chips */}
//         {messages.length <= 2 && (
//           <div className="space-y-1.5">
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
//               Suggested Questions
//             </p>
//             <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none flex-wrap">
//               {starterPrompts.map((prompt, idx) => (
//                 <button
//                   key={idx}
//                   onClick={() => sendMessage(prompt)}
//                   disabled={isLoading}
//                   className="h-8 text-[12px] px-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/40 transition-all whitespace-nowrap cursor-pointer flex-shrink-0 shadow-2xs"
//                 >
//                   {prompt}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Modern Clean AI Chat Composer */}
//         <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 shadow-2xs">
//           <textarea
//             ref={inputRef}
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder="Ask me anything about your career, resume strengths, target roles, interview prep..."
//             rows={1}
//             disabled={isLoading}
//             className="flex-1 resize-none bg-transparent border-0 px-1 py-1 text-[13.5px] sm:text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none max-h-28 leading-normal"
//           />
//           <button
//             onClick={handleSend}
//             disabled={!input.trim() || isLoading}
//             className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shadow-xs flex-shrink-0"
//             aria-label="Send message"
//           >
//             {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
// ─────────────────────────────────────────────────────────────
// 1. CONVERSATIONAL RAG CHAT COMPONENT
// Clean continuous workspace
// ─────────────────────────────────────────────────────────────

function AgentChatPanel() {
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
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isLoading])

  const handleSend = () => {
    const trimmed = input.trim()

    if (!trimmed || isLoading) return

    sendMessage(trimmed)
    setInput('')

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const starterPrompts = [
    'Analyze my resume & top skills',
    'Interview questions for my background',
    'Improve my ATS score',
    'Add architecture & leadership keywords',
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ─────────────────────────────────────────────
          STATUS BAR
      ───────────────────────────────────────────── */}
      <div className="pt-3 pb-3 flex items-center justify-between flex-shrink-0 text-xs border-b border-slate-200/70 dark:border-slate-800/70">

        <div className="flex items-center gap-2.5">

          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />

          <span className="font-bold text-slate-900 dark:text-slate-100 text-[12.5px]">
            TalentPrep Grounded AI Assistant
          </span>

          <span className="text-[12px] text-slate-400 font-normal">
            • Powered by Resume RAG + PGVector
          </span>

        </div>

        <button
          onClick={clearHistory}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer py-0.5 px-2 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
          title="Clear conversation history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>

      </div>


      {/* ─────────────────────────────────────────────
          CONVERSATION AREA
      ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-5 space-y-5 scroll-smooth pr-1">

        <AnimatePresence initial={false}>

          {messages.map((msg) => (

            <motion.div
              key={msg.id}
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.16,
              }}
              className="group"
            >

              {msg.role === 'user' ? (

                /* USER MESSAGE */
                <div className="flex justify-end pl-10">

                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-[14px] leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-2xs">

                    <p className="whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    <div className="text-[10px] text-blue-200 mt-1 text-right">
                      {new Intl.DateTimeFormat('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(new Date(msg.timestamp))}
                    </div>

                  </div>

                </div>

              ) : (

                /* AI MESSAGE */
                <div className="flex items-start gap-3.5 pr-4">

                  <div className="w-7 h-7 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">

                    <Bot className="w-4 h-4" />

                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">

                    <div className="text-[14.5px] leading-[1.65] text-slate-800 dark:text-slate-100 font-normal">

                      {renderMarkdown(msg.content)}

                    </div>


                    {/* Tool Activity */}
                    {msg.toolTrace && msg.toolTrace.length > 0 && (

                      <div className="flex items-center gap-1.5 pt-1">

                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Tool Activity:
                        </span>

                        <div className="flex flex-wrap gap-1">

                          {msg.toolTrace.map((tool) => (

                            <span
                              key={tool}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50"
                            >
                              {tool}
                            </span>

                          ))}

                        </div>

                      </div>

                    )}


                    <div className="text-[11px] text-slate-400 mt-1.5">

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


          {/* ─────────────────────────────────────
              THINKING / LOADING STATE
          ───────────────────────────────────── */}
          {isLoading && (

            <motion.div
              initial={{
                opacity: 0,
                y: 4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="flex items-start gap-3.5 pr-4"
            >

              <div className="w-7 h-7 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">

                <Sparkles className="w-4 h-4 animate-pulse" />

              </div>

              <div className="space-y-1.5 py-0.5">

                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">

                  <Loader2 className="w-3.5 h-3.5 animate-spin" />

                  <span>
                    TalentPrep Copilot is reasoning...
                  </span>

                </div>

                <div className="space-y-1 max-w-xs pt-0.5">

                  <div className="h-2 w-52 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />

                  <div className="h-2 w-36 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />

                </div>

              </div>

            </motion.div>

          )}

        </AnimatePresence>


        {/* Error */}
        {error && (

          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-600 flex items-center gap-2">

            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />

            <span>
              {error}
            </span>

          </div>

        )}


        <div ref={messagesEndRef} />

      </div>


      {/* ─────────────────────────────────────────────
          BOTTOM COMPOSER
          Slightly lower with controlled spacing
      ───────────────────────────────────────────── */}
      <div className="pt-4 pb-1 flex-shrink-0 space-y-3 bg-[#FAFBFC] dark:bg-slate-950">


        {/* ─────────────────────────────────────
            SUGGESTED QUESTIONS
        ───────────────────────────────────── */}
        {messages.length <= 2 && (

          <div className="space-y-1.5">

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
              Suggested Questions
            </p>

            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none flex-wrap">

              {starterPrompts.map((prompt, idx) => (

                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="h-8 text-[12px] px-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/40 transition-all whitespace-nowrap cursor-pointer flex-shrink-0 shadow-2xs"
                >
                  {prompt}
                </button>

              ))}

            </div>

          </div>

        )}


        {/* ─────────────────────────────────────
            CHAT INPUT
        ───────────────────────────────────── */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 shadow-2xs">

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your career, resume strengths, target roles, interview prep..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent border-0 px-1 py-1 text-[13.5px] sm:text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none max-h-28 leading-normal"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border disabled:border-border disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shadow-xs flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
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
function FindMatchingJobsWorkflow() {
  const navigate = useNavigate()
  const { selectedResumeId } = useResumeContext()
  const { data: resume } = useResume(selectedResumeId)
  const { data: details } = useResumeDetails(selectedResumeId)

  const [stage, setStage] = useState<'analyzing' | 'searching' | 'comparing' | 'complete'>('analyzing')
  const [jobs, setJobs] = useState<any[]>([])
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
        // const buildRoleQuery = () => {
        //   const skills = (details?.skills || '').toLowerCase()
        //   const summary = (details?.summary || '').toLowerCase()
        //   const experience = (details?.experience || '').toLowerCase()
        //   const profile = `${summary} ${experience} ${skills}`

        //   if (profile.includes('java') && (
        //     profile.includes('spring boot') ||
        //     profile.includes('springboot') ||
        //     profile.includes('microservices') ||
        //     profile.includes('backend') ||
        //     profile.includes('back-end')
        //   )) {
        //     return 'Java Backend Developer'
        //   }

        //   if (profile.includes('java')) return 'Java Developer'

        //   if (profile.includes('react') && (
        //     profile.includes('node') ||
        //     profile.includes('full stack') ||
        //     profile.includes('full-stack')
        //   )) {
        //     return 'Full Stack Developer'
        //   }

        //   if (profile.includes('python') && (
        //     profile.includes('django') ||
        //     profile.includes('flask') ||
        //     profile.includes('fastapi') ||
        //     profile.includes('backend')
        //   )) {
        //     return 'Python Backend Developer'
        //   }

        //   if (profile.includes('devops') || (profile.includes('kubernetes') && profile.includes('cloud'))) {
        //     return 'DevOps Engineer'
        //   }

        //   if (profile.includes('data engineer')) return 'Data Engineer'
        //   if (profile.includes('machine learning') || profile.includes('machine-learning')) return 'Machine Learning Engineer'
        //   if (profile.includes('ai engineer') || profile.includes('artificial intelligence')) return 'AI Engineer'

        //   const roleMatch = profile.match(/(?:senior|sr\.?|junior|jr\.?|lead)?\s*(software engineer|software developer|backend developer|frontend developer|full stack developer|data engineer|devops engineer|platform engineer|qa engineer|test engineer)/i)
        //   if (roleMatch?.[1]) return roleMatch[1].replace(/\s+/g, ' ').trim()

        //   return 'Software Engineer'
        // }


        // const result = await resumeApi.searchJobs({
        //   q: roleQuery,
        //   location: 'India',
        //   days: 30,
        //   limit: 10,
        // })
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
      } catch (err: any) {
        console.error('[AgentJobSearch] Failed:', err)
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Failed to search matching jobs.')
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
      <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              AI Career Agent Activity
            </h3>
          </div>
          {stage !== 'complete' && (
            <span className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> In Progress
            </span>
          )}
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Resume profile analyzed ({resume?.fileName || 'Active resume'})</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {stage === 'analyzing' ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            )}
            <span className={cn('font-medium', stage === 'analyzing' ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300')}>
              Searching active job opportunities
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {stage === 'analyzing' || stage === 'searching' ? (
              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0" />
            ) : stage === 'comparing' ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            )}
            <span className={cn('font-medium', stage === 'comparing' ? 'text-blue-600' : stage === 'complete' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400')}>
              Comparing live job requirements against your resume qualifications
            </span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600">
          {error}
        </div>
      )}

      {/* Results */}
      {stage === 'complete' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Matched Opportunities ({jobs.length} found)
            </h3>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Open in Job Explorer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jobs.map((job) => (
              <div
                key={job.job_id}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {job.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        {job.company} • {job.location}
                      </p>
                    </div>
                    {job.work_model && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex-shrink-0">
                        {job.work_model}
                      </span>
                    )}
                  </div>

                  {job.employment_type && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {job.employment_type}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
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
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-2xs">
        <div>
          <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
            Target Job Description
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Paste the full job posting text to analyze skill gaps and keyword alignment against your resume.
          </p>
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description requirements, responsibilities, and qualifications here..."
          rows={5}
          disabled={isProcessing || jobMatchMutation.isPending}
          className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <span className="text-[11px] text-slate-400">
            {jobDescription.length} characters
          </span>

          <button
            onClick={handleMatch}
            disabled={!jobDescription.trim() || !resume?.id || isProcessing || jobMatchMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border disabled:border-border disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            {isProcessing || jobMatchMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
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
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Comparing resume against job requirements...
              </span>
            </div>
            <span className="text-[11px] font-semibold text-blue-600">Analyzing skills</span>
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3.5 w-3/5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Match Results Panel */}
      {result && (
        <div className="space-y-3.5">
          {/* Top Overall Score Card */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-2xs">
            <div className="flex items-center gap-4">
              <ScoreRingContainer score={result.overallMatch ?? 0} size="lg" label="Match" color="#2563EB" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Compatibility</span>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  {result.overallMatch}% Overall Fit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(result.overallMatch ?? 0) >= 75
                    ? 'Strong alignment with key requirements.'
                    : 'Moderate alignment with noticeable skill gaps.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/resume/builder')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Improve Resume for This Job</span>
            </button>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Matched */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Strong Matches ({result.matchedSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200/60 dark:border-emerald-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing */}
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <XCircle className="w-3.5 h-3.5" />
                <span>Missing / Weak Areas ({result.missingSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missingSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200/60 dark:border-rose-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Recommended Improvements</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-blue-500 mt-1 font-bold">•</span>
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
    <div className="w-full max-w-[1140px] xl:max-w-[1280px] mx-auto flex flex-col h-full min-h-0 px-6 sm:px-8 lg:px-10 py-5 sm:py-6">
      {/* ── Page Header (Clean & Compact) ── */}
      <div className="pb-3 border-b border-slate-200/70 dark:border-slate-800/70 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI CAREER COPILOT</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-[26px] text-slate-900 dark:text-white tracking-tight leading-tight">
            AI Career Agent
          </h1>
          <p className="text-[13px] sm:text-[13.5px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
            Your AI career copilot to analyze resumes, find matching opportunities, and optimize applications.
          </p>
        </div>

        {/* ── Contextual Action Chips Row ── */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3.5 pb-1 scrollbar-none flex-wrap">
          <button
            onClick={() => setTabWithUrl('chat')}
            className={cn(
              'h-9.5 inline-flex items-center gap-2 px-4 text-[13px] font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap border shadow-2xs',
              activeTab === 'chat'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            )}
          >
            <Bot className="w-4 h-4" />
            <span>Ask About My Career</span>
          </button>

          <button
            onClick={() => setTabWithUrl('find_jobs')}
            className={cn(
              'h-9.5 inline-flex items-center gap-2 px-4 text-[13px] font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap border shadow-2xs',
              activeTab === 'find_jobs'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            )}
          >
            <Search className="w-4 h-4" />
            <span>Find Jobs Matching My Resume</span>
          </button>

          <button
            onClick={() => setTabWithUrl('match_jd')}
            className={cn(
              'h-9.5 inline-flex items-center gap-2 px-4 text-[13px] font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap border shadow-2xs',
              activeTab === 'match_jd'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            )}
          >
            <Target className="w-4 h-4" />
            <span>Match Resume to Job Description</span>
          </button>

          <button
            onClick={() => navigate('/resume/builder')}
            className="h-9.5 inline-flex items-center gap-2 px-4 text-[13px] font-semibold rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:text-blue-600 transition-all cursor-pointer whitespace-nowrap shadow-2xs sm:ml-auto"
          >
            <FileEdit className="w-4 h-4 text-blue-600" />
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
    <div className="flex-1 flex flex-col h-[calc(100dvh-0px)] overflow-hidden bg-[#FAFBFC] dark:bg-slate-950">
      <AIAgentInner />
    </div>
  )
}

