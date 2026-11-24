import { Link } from 'react-router-dom'
import {
  Bot,
  FileText,
  Send,
} from 'lucide-react'

export default function AIAgentSection() {
  const promptSuggestions = [
    'Analyze my skill gaps for a Principal Engineer role',
    'How do I frame distributed systems experience for Stripe?',
    'Identify weak bullet points in my work experience section',
  ]

  return (
    <section id="ai-agent" className="py-20 md:py-28 bg-[#FAF8F3] dark:bg-[#080908] border-t border-[#E5E0D5] dark:border-[#232621] relative overflow-hidden scroll-mt-20">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#080908] text-[#FAF8F3] text-xs font-mono mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
            Context-Aware Agent
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#080908] dark:text-[#FAF8F3] tracking-tight leading-[1.12] mb-3">
            An AI advisor grounded in your actual work history
          </h2>
          <p className="text-[#40433C] dark:text-[#B8BCAE] text-base leading-relaxed max-w-2xl mx-auto">
            Unlike generic chat tools, TalentPrep’s Career Agent evaluates questions with full context from your parsed resume, targeted job specs, and mock interview performance.
          </p>
        </div>

        {/* ── AI Workspace Showcase ── */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-[#080908]/15 dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] shadow-[0_8px_30px_rgba(8,9,8,0.06)] overflow-hidden">
            
            {/* Top Bar */}
            <div className="px-4 py-3 border-b border-[#E5E0D5] dark:border-[#232621] bg-[#FAF8F3] dark:bg-[#181A16] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#080908] text-[#CDF22B] flex items-center justify-center font-mono text-xs">
                  AI
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs text-[#080908] dark:text-[#FAF8F3]">
                    TalentPrep Career Agent
                  </h3>
                  <p className="text-[10px] text-[#383B36] dark:text-[#BDB9AF]">Contextual Reasoning Engine</p>
                </div>
              </div>

              {/* Active Context Chip */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-xs">
                <FileText className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                <span className="font-mono text-[#080908] dark:text-[#FAF8F3] text-[11px]">candidate_resume.pdf</span>
                <span className="text-[10px] font-mono text-[#080908] dark:text-[#CDF22B] bg-[#CDF22B]/20 px-1 rounded">Active</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-5 sm:p-6 space-y-4">
              
              {/* User Question */}
              <div className="flex items-start justify-end gap-3">
                <div className="max-w-xl px-4 py-2.5 rounded-lg bg-[#080908] text-[#FAF8F3] text-xs sm:text-sm leading-relaxed">
                  How should I position my microservices refactoring project when targeting Staff Infrastructure Engineer openings?
                </div>
              </div>

              {/* Agent Rich Response */}
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-7 h-7 rounded-md bg-[#FAF8F3] dark:bg-[#1A1C18] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex-1 p-4 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] space-y-2.5 text-xs sm:text-sm leading-relaxed text-[#080908] dark:text-[#FAF8F3]">
                  <div className="flex items-center justify-between border-b border-[#E5E0D5] dark:border-[#232621] pb-2">
                    <span className="font-bold text-xs">
                      Architecture Positioning Strategy
                    </span>
                    <span className="text-[10px] font-mono text-[#383B36] dark:text-[#BDB9AF]">Grounded in 6 yrs experience</span>
                  </div>

                  <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7]">
                    Rather than describing the migration as maintenance, lead with business resilience metrics:
                  </p>

                  <div className="p-2.5 rounded bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] font-mono text-[11px] text-[#080908] dark:text-[#FAF8F3]">
                    "Decoupled legacy monolith into 4 event-driven Go services, reducing p99 latency from 420ms to 65ms while maintaining 99.99% availability across 12M daily events."
                  </div>

                  <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7]">
                    This proves you solve for organizational reliability and blast radius containment, which Staff committees look for.
                  </p>
                </div>
              </div>

              {/* Prompt Suggestions */}
              <div className="pt-2 flex flex-wrap gap-2">
                {promptSuggestions.map((prompt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFFFF] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-xs text-[#080908] dark:text-[#FAF8F3] hover:border-[#080908] transition-colors cursor-pointer"
                  >
                    {prompt}
                  </span>
                ))}
              </div>

              {/* Simulated Input */}
              <div className="pt-2 flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#181A16] border border-[#E5E0D5] dark:border-[#232621] text-xs text-[#484B46] dark:text-[#BDB9AF]">
                  Ask about interview strategy, resume gaps, or role requirements...
                </div>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Chat</span>
                  <Send className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
