import { useState } from 'react'
import {
  Code2,
  Play,
  AlertCircle,
  Clock,
  Terminal,
  FileCode,
  Layers,
} from 'lucide-react'
import type { InterviewQuestionResponse } from '../types/interview.types'
import { formatRoundTitle } from '../utils/interviewFormatters'

interface CodingInterviewWorkspaceProps {
  question: InterviewQuestionResponse
  codeText: string
  onChangeCode: (val: string) => void
  onRunCode: (language: string, code: string) => Promise<string | null>
  onSubmitCode: (language: string, code: string) => void
  isSubmitting: boolean
  isTesting: boolean
  elapsedSeconds: number
}

const SUPPORTED_LANGUAGES = [
  { id: 'java', label: 'Java 17' },
  { id: 'python', label: 'Python 3' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
]

const LANGUAGE_STARTERS: Record<string, string> = {
  java: `public class Solution {\n    public int solve() {\n        // Write your solution here\n        return 0;\n    }\n}`,
  python: `class Solution:\n    def solve(self):\n        # Write your solution here\n        pass\n`,
  typescript: `function solve(): void {\n    // Write your solution here\n}\n`,
  javascript: `function solve() {\n    // Write your solution here\n}\n`,
}

export default function CodingInterviewWorkspace({
  question,
  codeText,
  onChangeCode,
  onRunCode,
  onSubmitCode,
  isSubmitting,
  isTesting,
  elapsedSeconds,
}: CodingInterviewWorkspaceProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('java')
  const [testOutput, setTestOutput] = useState<string | null>(null)

  // Initialize with question boilerplate or starter template if empty
  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang)
    const isDefaultCode =
      !codeText.trim() ||
      Object.values(LANGUAGE_STARTERS).some((starter) => starter.trim() === codeText.trim()) ||
      (question.codingBoilerplate && question.codingBoilerplate.trim() === codeText.trim())

    if (isDefaultCode) {
      if (newLang === 'java' && question.codingBoilerplate) {
        onChangeCode(question.codingBoilerplate)
      } else {
        onChangeCode(LANGUAGE_STARTERS[newLang] || '')
      }
    }
  }

  const handleTestRun = async () => {
    setTestOutput('Requesting sandbox execution status...')
    const result = await onRunCode(selectedLanguage, codeText)
    setTestOutput(
      result ||
        'Execution sandbox is currently unavailable. Please submit code directly for AI evaluation.'
    )
  }

  const handleSubmit = () => {
    if (!codeText.trim() || isSubmitting) return
    onSubmitCode(selectedLanguage, codeText)
  }

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="space-y-4">
      {/* ── Sandbox Status Notice Banner ── */}
      <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200/90 space-y-0.5">
          <p className="font-semibold">Sandbox Execution Notice</p>
          <p className="text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Live isolated sandbox compilation is currently offline. You can write and refine your solution below, then select <strong>Submit Code for AI Review</strong> for algorithmic design, complexity, and edge-case evaluation.
          </p>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Problem & Test Cases */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatRoundTitle(question.roundType)}</span>
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">{formatElapsed(elapsedSeconds)}</span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {question.questionText}
            </h3>

            {question.questionCategory && (
              <div className="pt-1">
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Category: {question.questionCategory}
                </span>
              </div>
            )}
          </div>

          {/* Test Cases Specification */}
          {question.codingTestCases && question.codingTestCases.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span>Example Test Cases</span>
              </div>

              <div className="space-y-2">
                {question.codingTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-mono space-y-1.5"
                  >
                    <p className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider">
                      Case {String(idx + 1).padStart(2, '0')} {tc.description ? `— ${tc.description}` : ''}
                    </p>
                    <div className="space-y-1">
                      <p className="text-slate-800 dark:text-slate-200">
                        <span className="text-slate-400 select-none font-sans text-[11px]">Input: </span>
                        <code>{tc.input}</code>
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-400">
                        <span className="text-slate-400 select-none font-sans text-[11px]">Expected: </span>
                        <code>{tc.expectedOutput}</code>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Actions */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Solution Editor
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500 font-medium">Language:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Code Textarea with Mono Font */}
            <textarea
              value={codeText}
              onChange={(e) => onChangeCode(e.target.value)}
              placeholder="// Write your code solution here..."
              rows={15}
              spellCheck={false}
              className="w-full bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors leading-relaxed resize-y"
            />

            {/* Output / Console Message */}
            {testOutput && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300/90 whitespace-pre-wrap leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-sans font-semibold uppercase tracking-wider">
                  <Terminal className="w-3 h-3" />
                  <span>Execution Console</span>
                </div>
                <div className="text-slate-300">{testOutput}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestRun}
                disabled={isTesting || !codeText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Checking Sandbox...' : 'Run Code (Check)'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!codeText.trim() || isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Solution...</span>
                  </>
                ) : (
                  <>
                    <Code2 className="w-4 h-4" />
                    <span>Submit Code for AI Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
