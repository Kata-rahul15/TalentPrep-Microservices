import { useState, useRef, useEffect, useMemo } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import {
  Code2,
  Play,
  Terminal,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Sliders,
  FileText,
  Pause,
  FastForward,
  LogOut,
  GripVertical,
  GripHorizontal,
  Layers,
  AlertCircle,
  CheckCheck,
  XCircle,
} from 'lucide-react'
import type {
  CodeRunResult,
  InterviewQuestionResponse,
  InterviewSessionResponse,
} from '../types/interview.types'
import { parseCodingQuestion, safeString } from '../utils/codingProblemParser'
import { cn } from '@/lib/utils'

export interface CodingInterviewWorkspaceProps {
  question: InterviewQuestionResponse
  codeText: string
  onChangeCode: (val: string) => void
  onRunCode?: (language: string, code: string) => Promise<CodeRunResult | string | null>
  onSubmitCode?: (language: string, code: string) => void
  isSubmitting?: boolean
  isTesting?: boolean
  elapsedSeconds?: number

  // Read-only / Review mode
  readOnly?: boolean
  initialLanguage?: string
  persistedScore?: number | null
  persistedMetrics?: any

  // Session & Header controls
  session?: InterviewSessionResponse
  remainingSeconds?: number
  connectionStatus?: 'connected' | 'connecting' | 'reconnecting' | 'reconciling' | 'disconnected' | 'error'
  statusDetail?: string | null
  onPause?: () => void
  onResume?: () => void
  onSkip?: () => void
  onEndEarly?: () => void
  isPaused?: boolean
  isEnding?: boolean
  isSkipping?: boolean
  isControlsDisabled?: boolean
  errorMessage?: string | null
  onDismissError?: () => void
  hideHeader?: boolean
}

const SUPPORTED_LANGUAGES = [
  { id: 'java', label: 'Java 25 (OpenJDK)', monacoLang: 'java' },
  { id: 'python', label: 'Python 3.14', monacoLang: 'python' },
  { id: 'cpp', label: 'C++ 15 (g++)', monacoLang: 'cpp' },
  { id: 'javascript', label: 'JavaScript (Node 24)', monacoLang: 'javascript' },
  { id: 'typescript', label: 'TypeScript (Deno)', monacoLang: 'typescript' },
]

const LANGUAGE_STARTERS: Record<string, string> = {
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        System.out.println("Hello, World!");
    }
}`,
  python: `import sys

def solve():
    # Write your solution here
    print("Hello, World!")

if __name__ == '__main__':
    solve()
`,
  cpp: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    // Write your solution here
    cout << "Hello, World!" << endl;
    return 0;
}
`,
  javascript: `const fs = require('fs');

function solve() {
    // Write your solution here
    console.log("Hello, World!");
}

solve();
`,
  typescript: `// Write your solution here
console.log("Hello, World!");
`,
}

function FormattedText({ text }: { text: string }) {
  if (!text) return null
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="font-mono text-[11px] sm:text-xs px-1.5 py-0.5 rounded bg-secondary-bg border border-border/80 text-foreground font-semibold"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export default function CodingInterviewWorkspace({
  question,
  codeText,
  onChangeCode,
  onRunCode,
  onSubmitCode,
  isSubmitting = false,
  isTesting = false,
  elapsedSeconds = 0,
  readOnly = false,
  initialLanguage = 'java',
  persistedScore,
  persistedMetrics,
  session,
  remainingSeconds = 0,
  connectionStatus = 'connected',
  statusDetail,
  onPause,
  onResume,
  onSkip,
  onEndEarly,
  isPaused = false,
  isEnding = false,
  isSkipping = false,
  isControlsDisabled = false,
  errorMessage,
  onDismissError,
  hideHeader = false,
}: CodingInterviewWorkspaceProps) {
  // ── Language State ──
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage || 'java')

  useEffect(() => {
    if (initialLanguage && initialLanguage !== selectedLanguage) {
      setSelectedLanguage(initialLanguage)
    }
  }, [initialLanguage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to determine starter code for a language
  const getStarterForLang = (lang: string) => {
    if (question.codingStarterTemplates && question.codingStarterTemplates[lang]) {
      return question.codingStarterTemplates[lang]
    }
    if (lang === 'java' && question.codingBoilerplate && question.codingBoilerplate.trim()) {
      return question.codingBoilerplate
    }
    return LANGUAGE_STARTERS[lang] || ''
  }

  // ── Navigation & Tab States ──
  const [leftTab, setLeftTab] = useState<'description' | 'examples' | 'constraints'>('description')
  const [rightBottomTab, setRightBottomTab] = useState<'testcases' | 'results'>(readOnly ? 'results' : 'testcases')
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0)
  const [isConsoleOpen, setIsConsoleOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ── Confirmation Modal States ──
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // ── Execution State ──
  const [testOutput, setTestOutput] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<CodeRunResult | null>(() => {
    if (!persistedMetrics) return null
    return {
      compiled: persistedMetrics.compiled ?? true,
      compilationOutput: persistedMetrics.compilationOutput,
      passedAllTestCases:
        persistedMetrics.passedAllTestCases ??
        ((persistedMetrics.passedCount || 0) === (persistedMetrics.totalCount || 0) && (persistedMetrics.totalCount || 0) > 0),
      passedCount: persistedMetrics.passedCount ?? 0,
      totalCount: persistedMetrics.totalCount ?? 0,
      executionTimeMs: persistedMetrics.executionTimeMs ?? 0,
      memoryUsedBytes: persistedMetrics.memoryUsedBytes ?? 0,
      verdict: persistedMetrics.verdict ?? 'ACCEPTED',
      testCaseResults: persistedMetrics.testCaseResults ?? [],
      stdout: persistedMetrics.stdout,
      stderr: persistedMetrics.stderr,
      errorMessage: persistedMetrics.errorMessage,
    }
  })
  const [activeResultTestCaseIndex, setActiveResultTestCaseIndex] = useState(0)
  const [hasRunCode, setHasRunCode] = useState(Boolean(persistedMetrics || readOnly))

  // Update run result if persisted metrics changes (e.g. Switching question review tabs)
  useEffect(() => {
    if (persistedMetrics) {
      setRunResult({
        compiled: persistedMetrics.compiled ?? true,
        compilationOutput: persistedMetrics.compilationOutput,
        passedAllTestCases:
          persistedMetrics.passedAllTestCases ??
          ((persistedMetrics.passedCount || 0) === (persistedMetrics.totalCount || 0) && (persistedMetrics.totalCount || 0) > 0),
        passedCount: persistedMetrics.passedCount ?? 0,
        totalCount: persistedMetrics.totalCount ?? 0,
        executionTimeMs: persistedMetrics.executionTimeMs ?? 0,
        memoryUsedBytes: persistedMetrics.memoryUsedBytes ?? 0,
        verdict: persistedMetrics.verdict ?? 'ACCEPTED',
        testCaseResults: persistedMetrics.testCaseResults ?? [],
        stdout: persistedMetrics.stdout,
        stderr: persistedMetrics.stderr,
        errorMessage: persistedMetrics.errorMessage,
      })
      setHasRunCode(true)
      setRightBottomTab('results')
    }
  }, [persistedMetrics])

  // ── Resizing States ──
  // Horizontal split: width percentage of left panel (default 42%)
  const [leftWidthPercent, setLeftWidthPercent] = useState(42)
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false)

  // Vertical split in right panel: height of bottom results area in px (default 240px)
  const [bottomHeightPx, setBottomHeightPx] = useState(240)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false)

  const workspaceRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  // ── Parse Question Details ──
  const parsedProblem = useMemo(() => {
    return parseCodingQuestion(
      question.questionText,
      question.questionCategory,
      question.codingTestCases
    )
  }, [question.questionText, question.questionCategory, question.codingTestCases])

  // Active test cases list: prefer structured codingTestCases, fallback to parsed examples, safely normalized
  const activeTestCases = useMemo(() => {
    const rawList =
      question.codingTestCases && Array.isArray(question.codingTestCases) && question.codingTestCases.length > 0
        ? question.codingTestCases
        : parsedProblem.examples.map((ex) => ({
            input: ex.input,
            expectedOutput: ex.output,
            description: ex.explanation,
          }))

    return rawList.map((tc) => ({
      input: safeString(tc.input),
      expectedOutput: safeString(tc.expectedOutput, true),
      description: tc.description ? safeString(tc.description) : undefined,
    }))
  }, [question.codingTestCases, parsedProblem.examples])

  // Initialize with question boilerplate or starter template if empty
  useEffect(() => {
    if (readOnly) return
    const currentCode = typeof codeText === 'string' ? codeText.trim() : ''
    if (!currentCode) {
      onChangeCode(getStarterForLang(selectedLanguage))
    }
  }, [question.questionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle Language Switch ──
  const handleLanguageChange = (newLang: string) => {
    if (readOnly) return
    setSelectedLanguage(newLang)
    const current = typeof codeText === 'string' ? codeText.trim() : ''
    const currentStarter = getStarterForLang(selectedLanguage).trim()
    const isDefaultCode =
      !current ||
      current === currentStarter ||
      Object.values(LANGUAGE_STARTERS).some((starter) => starter.trim() === current) ||
      (question.codingBoilerplate && question.codingBoilerplate.trim() === current)

    if (isDefaultCode) {
      onChangeCode(getStarterForLang(newLang))
    }
  }

  // ── Handle Reset Code ──
  const handleResetCode = () => {
    if (readOnly) return
    onChangeCode(getStarterForLang(selectedLanguage))
    setShowResetConfirm(false)
  }

  // ── Handle Copy Code ──
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeText || '')
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      // fallback
    }
  }

  // ── Handle Run Code ──
  const handleTestRun = async () => {
    if (readOnly || !onRunCode) return
    const current = typeof codeText === 'string' ? codeText : ''
    if (!current.trim() || isTesting) return
    setHasRunCode(true)
    setIsConsoleOpen(true)
    setRightBottomTab('results')
    setRunResult(null)
    setTestOutput('Executing code in OnlineCompiler.io sandbox...')

    const result = await onRunCode(selectedLanguage, current)
    if (!result) {
      setTestOutput('Code execution failed. Please verify syntax and connection.')
    } else if (typeof result === 'string') {
      setTestOutput(result)
    } else {
      setRunResult(result)
      setActiveResultTestCaseIndex(0)
      setTestOutput(result.compilationOutput || result.stdout || result.stderr || null)
    }
  }

  // ── Handle Submit Code ──
  const handleSubmit = () => {
    if (readOnly || !onSubmitCode) return
    const current = typeof codeText === 'string' ? codeText : ''
    if (!current.trim() || isSubmitting) return
    onSubmitCode(selectedLanguage, current)
  }

  // ── Monaco Editor Mount Handler ──
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    editor.focus()
  }

  // ── Horizontal Drag Resizer ──
  const handleMouseDownHorizontal = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingHorizontal(true)
  }

  useEffect(() => {
    if (!isDraggingHorizontal) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return
      const rect = workspaceRef.current.getBoundingClientRect()
      const clientX = e.clientX
      const newPercent = ((clientX - rect.left) / rect.width) * 100
      // Clamped between 26% and 65%
      const clamped = Math.max(26, Math.min(65, newPercent))
      setLeftWidthPercent(clamped)
    }

    const handleMouseUp = () => {
      setIsDraggingHorizontal(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDraggingHorizontal])

  // ── Vertical Drag Resizer in Right Panel ──
  const handleMouseDownVertical = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingVertical(true)
  }

  useEffect(() => {
    if (!isDraggingVertical) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!rightPanelRef.current) return
      const rect = rightPanelRef.current.getBoundingClientRect()
      const newHeight = rect.bottom - e.clientY
      // Clamped between 140px and 480px
      const clamped = Math.max(140, Math.min(480, newHeight))
      setBottomHeightPx(clamped)
    }

    const handleMouseUp = () => {
      setIsDraggingVertical(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDraggingVertical])

  // ── Format Timer Countdown ──
  const formatCountdown = (sec: number) => {
    if (sec <= 0) return '00:00'
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`
  }

  // ── Render Difficulty Badge ──
  const renderDifficultyBadge = (diff: string = 'MEDIUM') => {
    const d = diff.toUpperCase()
    if (d === 'EASY') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          Easy
        </span>
      )
    }
    if (d === 'HARD') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
          Hard
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        Medium
      </span>
    )
  }

  // ── Render Connection Badge ──
  const renderConnectionPill = () => {
    const dotColors: Record<typeof connectionStatus, string> = {
      connected: 'bg-emerald-500',
      connecting: 'bg-[#CDF22B] animate-pulse',
      reconnecting: 'bg-amber-500 animate-pulse',
      reconciling: 'bg-amber-500 animate-pulse',
      disconnected: 'bg-[#484B46]',
      error: 'bg-rose-500',
    }
    const labelMap: Record<typeof connectionStatus, string> = {
      connected: 'Live Sync',
      connecting: 'Connecting...',
      reconnecting: 'Reconnecting...',
      reconciling: 'Syncing...',
      disconnected: 'Offline',
      error: 'Channel Error',
    }
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary-bg/80 border border-border text-[11px] text-foreground font-medium select-none"
        title={statusDetail || labelMap[connectionStatus]}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[connectionStatus]}`} />
        <span>{labelMap[connectionStatus]}</span>
      </div>
    )
  }

  const monacoLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage)?.monacoLang || 'java'

  return (
    <div
      className={cn(
        'w-full bg-[#FAF8F3] dark:bg-[#080908] text-foreground flex flex-col select-text font-sans',
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-screen overflow-hidden'
      )}
    >
      {/* ── PAUSE OVERLAY ── */}
      {isPaused && (
        <div className="fixed inset-0 z-40 bg-[#080908]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 sm:p-7 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-[#080908] text-[#CDF22B] flex items-center justify-center mx-auto shadow-2xs">
              <Pause className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
                Coding Interview Paused
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your countdown timer and session progress are suspended. Click resume when you are ready to continue coding.
              </p>
            </div>
            <button
              type="button"
              onClick={onResume}
              disabled={isControlsDisabled}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#CDF22B] hover:bg-[#b8da25] text-[#080908] font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-2xs active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Interview</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT TOP HEADER (< 48px)
      ───────────────────────────────────────────────────────────── */}
      {!hideHeader && (
        <header className="h-12 flex-shrink-0 bg-card border-b border-border px-3 sm:px-4 flex items-center justify-between gap-3 z-20">
          {/* Left: Identifier, Role Title, Round, Difficulty */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
              <Terminal className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-heading font-bold text-xs sm:text-sm text-foreground truncate">
                {session?.targetRole || 'Coding Interview'}
              </span>

              <span className="text-muted-foreground text-xs hidden sm:inline">•</span>

              <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-secondary-bg border border-border hidden sm:inline-block">
                Question 0{question.questionOrder || 1} of 0{question.targetQuestionCount || 2}
              </span>

              {readOnly ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                  Review Mode
                </span>
              ) : (
                renderDifficultyBadge(question.difficulty || session?.difficulty)
              )}
            </div>
          </div>

          {/* Right: Live Sync, Timer, Pause, Skip, End Interview */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {readOnly ? (
              <div className="flex items-center gap-2">
                {persistedScore !== null && persistedScore !== undefined && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold">
                    Score: {persistedScore}%
                  </span>
                )}
              </div>
            ) : (
              <>
                {renderConnectionPill()}

                {/* Timer Countdown */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-bg border border-border font-mono text-xs font-bold text-foreground"
                  title="Interview remaining time"
                >
                  <Clock className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                  <span className="tabular-nums">{formatCountdown(remainingSeconds)}</span>
                </div>

                {/* Session Control Buttons */}
                <div className="flex items-center gap-1 pl-1">
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={onResume}
                      disabled={isControlsDisabled}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#080908] hover:bg-[#1e201c] disabled:opacity-50 text-[#CDF22B] text-xs font-bold transition-colors cursor-pointer"
                      title="Resume Interview"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span className="hidden md:inline">Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onPause}
                      disabled={isControlsDisabled}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary-bg hover:bg-muted border border-border text-foreground text-xs font-medium transition-colors cursor-pointer"
                      title="Pause Interview"
                    >
                      <Pause className="w-3 h-3" />
                      <span className="hidden md:inline">Pause</span>
                    </button>
                  )}

                  {onSkip && (
                    <button
                      type="button"
                      onClick={() => setShowSkipConfirm(true)}
                      disabled={isControlsDisabled || isSkipping || isPaused}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary-bg hover:bg-muted border border-border text-foreground text-xs font-medium transition-colors cursor-pointer"
                      title="Skip to Next Question"
                    >
                      <FastForward className="w-3 h-3 text-muted-foreground" />
                      <span className="hidden md:inline">Skip</span>
                    </button>
                  )}

                  {onEndEarly && (
                    <button
                      type="button"
                      onClick={() => setShowEndConfirm(true)}
                      disabled={isControlsDisabled || isEnding}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-rose-600 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                      title="End Interview Early"
                    >
                      <LogOut className="w-3 h-3" />
                      <span className="hidden md:inline">End</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </header>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. OPTIONAL COMPACT ERROR BANNER
      ───────────────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="flex-shrink-0 bg-rose-500/10 border-b border-rose-500/20 px-4 py-1.5 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              className="text-[11px] font-semibold underline hover:no-underline cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN TWO-PANEL RESIZABLE WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      <main
        ref={workspaceRef}
        className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden relative"
      >
        {/* ── LEFT PANEL: Problem Description, Examples, Constraints (~40%) ── */}
        <section
          style={{ width: `${leftWidthPercent}%` }}
          className="h-full flex flex-col bg-card border-r border-border min-w-[280px] overflow-hidden"
        >
          {/* Top Tabs (Description, Examples, Constraints) */}
          <div className="flex-shrink-0 h-10 border-b border-border bg-secondary-bg/40 px-3 flex items-center justify-between gap-1 select-none">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLeftTab('description')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                  leftTab === 'description'
                    ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary-bg'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Description</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('examples')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                  leftTab === 'examples'
                    ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary-bg'
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Examples</span>
                {activeTestCases.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-secondary-bg border border-border text-muted-foreground">
                    {activeTestCases.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('constraints')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                  leftTab === 'constraints'
                    ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary-bg'
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Constraints</span>
              </button>
            </div>

            {/* Quick Question Order Indicator */}
            <span
              className="text-[11px] font-mono text-muted-foreground hidden sm:inline"
              title="Current question order & elapsed question time"
            >
              Q{question.questionOrder || 1} • {formatCountdown(elapsedSeconds)}
            </span>
          </div>

          {/* Problem Body (Independently Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
            {/* Problem Title & Category Header */}
            <div className="space-y-2 pb-3 border-b border-border/70">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {String(question.questionOrder || 1).padStart(2, '0')}.
                </span>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                  {parsedProblem.title}
                </h1>
              </div>

              {/* Tags & Metadata Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {renderDifficultyBadge(question.difficulty)}

                {(question.questionCategory || question.topic) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary-bg text-muted-foreground border border-border">
                    <Layers className="w-3 h-3 text-muted-foreground" />
                    <span>{question.questionCategory || question.topic}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-secondary-bg border border-border">
                  Round: {question.roundType || 'CODING'}
                </span>
              </div>
            </div>

            {/* ── TAB 1: DESCRIPTION ── */}
            {leftTab === 'description' && (
              <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {/* Formatted Paragraphs */}
                {parsedProblem.descriptionParagraphs.map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed whitespace-pre-line">
                    <FormattedText text={paragraph} />
                  </p>
                ))}

                {/* Schemas / Tables if present (e.g. SQL / Struct) */}
                {parsedProblem.schemas && parsedProblem.schemas.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {parsedProblem.schemas.map((schema, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-lg border border-border bg-secondary-bg/60 p-3 space-y-1.5"
                      >
                        <p className="text-[11px] font-bold text-foreground font-mono">
                          {schema.title} Schema
                        </p>
                        <pre className="text-xs font-mono text-foreground overflow-x-auto whitespace-pre p-2 bg-card rounded border border-border/80">
                          {schema.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up / Thought Prompt */}
                {parsedProblem.followUp && (
                  <div className="p-3.5 rounded-lg bg-[#CDF22B]/10 border border-[#CDF22B]/30 text-xs text-foreground space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#080908] dark:text-[#CDF22B]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Follow-up Challenge</span>
                    </div>
                    <p className="leading-relaxed text-muted-foreground">
                      {parsedProblem.followUp}
                    </p>
                  </div>
                )}

                {/* Quick Hint & Switch to Examples */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>See test cases in Examples tab.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeftTab('examples')}
                    className="font-medium text-foreground underline hover:no-underline cursor-pointer"
                  >
                    View Test Cases ({activeTestCases.length}) →
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 2: EXAMPLES ── */}
            {leftTab === 'examples' && (
              <div className="space-y-3.5">
                <p className="text-xs text-muted-foreground">
                  The following test cases demonstrate the expected input/output mapping:
                </p>

                {activeTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-card p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground font-sans">
                        Example {idx + 1}
                      </span>
                      {tc.description && (
                        <span className="text-[11px] text-muted-foreground italic truncate max-w-[200px]">
                          {tc.description}
                        </span>
                      )}
                    </div>

                    {/* Input */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Input
                      </span>
                      <pre className="text-xs font-mono p-2.5 rounded-lg bg-secondary-bg/80 border border-border text-foreground overflow-x-auto select-all">
                        {tc.input}
                      </pre>
                    </div>

                    {/* Output */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Expected Output
                      </span>
                      <pre className="text-xs font-mono p-2.5 rounded-lg bg-[#CDF22B]/15 border border-[#CDF22B]/30 text-foreground font-semibold overflow-x-auto select-all">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB 3: CONSTRAINTS ── */}
            {leftTab === 'constraints' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-border bg-secondary-bg/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Technical Constraints & Assumptions</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ensure your algorithm accommodates the following limits without exceeding time or memory bounds:
                  </p>
                </div>

                <ul className="space-y-2 pt-1">
                  {parsedProblem.constraints.map((constraint, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg border border-border/80 bg-card text-xs text-foreground flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B] mt-1.5 flex-shrink-0" />
                      <span className="font-mono leading-relaxed">
                        <FormattedText text={constraint} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ── DRAGGABLE DIVIDER (Horizontal Split) ── */}
        <div
          onMouseDown={handleMouseDownHorizontal}
          onDoubleClick={() => setLeftWidthPercent(42)}
          title="Drag to resize workspace panels (Double click to reset)"
          className={cn(
            'w-2 flex-shrink-0 bg-transparent hover:bg-[#CDF22B]/40 active:bg-[#CDF22B] transition-colors cursor-col-resize flex items-center justify-center relative select-none group z-10',
            isDraggingHorizontal && 'bg-[#CDF22B]'
          )}
        >
          <div className="w-1 h-8 rounded-full bg-border group-hover:bg-[#080908] dark:group-hover:bg-[#FAF8F3] transition-colors flex items-center justify-center">
            <GripVertical className="w-2.5 h-2.5 text-muted-foreground opacity-60" />
          </div>
        </div>

        {/* ── RIGHT PANEL: Professional Code Editor & Execution Results (~60%) ── */}
        <section
          ref={rightPanelRef}
          style={{ width: `${100 - leftWidthPercent}%` }}
          className="h-full flex flex-col bg-card min-w-[320px] overflow-hidden"
        >
          {/* ─────────────────────────────────────────────────────────────
              4. CODE EDITOR TOP TOOLBAR
          ───────────────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 h-10 border-b border-border bg-secondary-bg/40 px-3 flex items-center justify-between gap-2 select-none">
            {/* Left: Code Identifier & Language Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-foreground bg-card border border-border/80 shadow-2xs">
                <Code2 className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                <span>Code</span>
              </div>

              {/* Language Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={readOnly}
                  className={cn(
                    "bg-card border border-border rounded-md px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#080908] transition-colors shadow-2xs",
                    readOnly ? "cursor-default opacity-80" : "cursor-pointer"
                  )}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: Actions (Copy, Reset, Fullscreen) */}
            <div className="flex items-center gap-1 text-muted-foreground">
              {/* Copy Code Button */}
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy code to clipboard"
                className="p-1.5 rounded hover:bg-secondary-bg hover:text-foreground transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Reset Code Button */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  title="Reset solution to initial template"
                  className="p-1.5 rounded hover:bg-secondary-bg hover:text-foreground transition-colors cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
                className="p-1.5 rounded hover:bg-secondary-bg hover:text-foreground transition-colors cursor-pointer text-xs"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              5. MONACO CODE EDITOR (Takes available height)
          ───────────────────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 relative bg-[#1e1e1e]">
            <Editor
              height="100%"
              language={monacoLanguage}
              value={codeText}
              onChange={(val) => !readOnly && onChangeCode(val || '')}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: readOnly,
                domReadOnly: readOnly,
                minimap: { enabled: false },
                fontSize: 13.5,
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, monospace",
                fontLigatures: true,
                lineNumbers: 'on',
                lineNumbersMinChars: 3,
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 8,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: selectedLanguage === 'python' ? 4 : 2,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                renderLineHighlight: 'all',
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* ── DRAGGABLE DIVIDER (Vertical Split in Right Panel) ── */}
          {isConsoleOpen && (
            <div
              onMouseDown={handleMouseDownVertical}
              onDoubleClick={() => setBottomHeightPx(240)}
              title="Drag to resize console (Double click to reset)"
              className={cn(
                'h-2 flex-shrink-0 bg-transparent hover:bg-[#CDF22B]/40 active:bg-[#CDF22B] transition-colors cursor-row-resize flex items-center justify-center relative select-none group z-10 border-t border-border/80',
                isDraggingVertical && 'bg-[#CDF22B]'
              )}
            >
              <div className="h-1 w-12 rounded-full bg-border group-hover:bg-[#080908] dark:group-hover:bg-[#FAF8F3] transition-colors flex items-center justify-center">
                <GripHorizontal className="w-2.5 h-2.5 text-muted-foreground opacity-60" />
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              6. RESULTS / TEST CASES PANEL (Collapsible / Resizable)
          ───────────────────────────────────────────────────────────── */}
          {isConsoleOpen && (
            <div
              style={{ height: `${bottomHeightPx}px` }}
              className="flex-shrink-0 flex flex-col bg-card border-t border-border overflow-hidden"
            >
              {/* Results Tabs Header */}
              <div className="flex-shrink-0 h-9 border-b border-border bg-secondary-bg/40 px-3 flex items-center justify-between gap-1 select-none">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRightBottomTab('testcases')}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer',
                      rightBottomTab === 'testcases'
                        ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Test Cases</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightBottomTab('results')}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer',
                      rightBottomTab === 'results'
                        ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Test Results</span>
                    {hasRunCode && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                </div>

                {/* Minimize Console Chevron */}
                <button
                  type="button"
                  onClick={() => setIsConsoleOpen(false)}
                  title="Minimize Console"
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Results Tab Body */}
              <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar text-xs">
                {/* ── SUB-TAB: TEST CASES ── */}
                {rightBottomTab === 'testcases' && (
                  <div className="space-y-3">
                    {/* Test Case Selector Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {activeTestCases.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedTestCaseIndex(idx)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer',
                            selectedTestCaseIndex === idx
                              ? 'bg-[#080908] text-[#CDF22B] shadow-2xs'
                              : 'bg-secondary-bg hover:bg-muted text-foreground border border-border'
                          )}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Active Test Case Data */}
                    {activeTestCases[selectedTestCaseIndex] && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                            Input
                          </span>
                          <div className="p-2.5 rounded-lg bg-secondary-bg/90 border border-border font-mono text-xs text-foreground overflow-x-auto">
                            {activeTestCases[selectedTestCaseIndex].input}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                            Expected Output
                          </span>
                          <div className="p-2.5 rounded-lg bg-secondary-bg/90 border border-border font-mono text-xs text-foreground overflow-x-auto font-semibold">
                            {activeTestCases[selectedTestCaseIndex].expectedOutput}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── SUB-TAB: TEST RESULTS ── */}
                {rightBottomTab === 'results' && (
                  <div className="space-y-3">
                    {!hasRunCode && !isTesting && (
                      <div className="py-6 text-center text-muted-foreground space-y-1.5">
                        <Terminal className="w-5 h-5 mx-auto opacity-40" />
                        <p className="font-medium text-xs">You must run your code first</p>
                        <p className="text-[11px] text-muted-foreground/80">
                          Click <strong>Run Code</strong> below to check syntax and sandbox execution.
                        </p>
                      </div>
                    )}

                    {isTesting && (
                      <div className="py-6 flex flex-col items-center justify-center space-y-2 text-xs text-muted-foreground">
                        <div className="w-5 h-5 border-2 border-[#080908] dark:border-[#CDF22B] border-t-transparent rounded-full animate-spin" />
                        <span>Executing code in sandbox...</span>
                      </div>
                    )}

                    {hasRunCode && !isTesting && (
                      <div className="space-y-3">
                        {/* 1. If Compilation Error */}
                        {runResult && !runResult.compiled && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Compilation Error</span>
                              </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[#0d1117] text-rose-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-rose-900/40 leading-relaxed">
                              {runResult.compilationOutput || runResult.errorMessage || 'Compilation failed.'}
                            </div>
                          </div>
                        )}

                        {/* 2. If Compiled Successfully with Test Cases */}
                        {runResult && runResult.compiled && (
                          <div className="space-y-3">
                            {/* Verdict Header & Performance Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border">
                              <div className="flex items-center gap-2">
                                {runResult.passedAllTestCases ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Accepted</span>
                                  </span>
                                ) : runResult.verdict === 'TIME_LIMIT_EXCEEDED' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Time Limit Exceeded</span>
                                  </span>
                                ) : runResult.verdict === 'RUNTIME_ERROR' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Runtime Error</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Wrong Answer</span>
                                  </span>
                                )}

                                <span className="text-xs font-medium text-muted-foreground">
                                  Passed {runResult.passedCount ?? 0} / {runResult.totalCount ?? 0} test cases
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                                <span className="px-2 py-0.5 rounded bg-secondary-bg border border-border">
                                  Runtime: {runResult.executionTimeMs ?? 0} ms
                                </span>
                                {(runResult.memoryUsedBytes ?? 0) > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-secondary-bg border border-border">
                                    Memory: {Math.round((runResult.memoryUsedBytes ?? 0) / 1024)} KB
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Test Cases Tabs */}
                            {runResult.testCaseResults && runResult.testCaseResults.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                  {runResult.testCaseResults.map((tc, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setActiveResultTestCaseIndex(idx)}
                                      className={cn(
                                        'px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                                        activeResultTestCaseIndex === idx
                                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                          : 'bg-secondary-bg hover:bg-muted text-muted-foreground border border-border'
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          'w-2 h-2 rounded-full',
                                          tc.passed ? 'bg-emerald-500' : 'bg-rose-500'
                                        )}
                                      />
                                      <span>Case {idx + 1}</span>
                                    </button>
                                  ))}
                                </div>

                                {/* Active Case Detail */}
                                {runResult.testCaseResults[activeResultTestCaseIndex] && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                                        Input
                                      </span>
                                      <div className="p-2 rounded bg-secondary-bg/90 border border-border font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                                        {runResult.testCaseResults[activeResultTestCaseIndex].input}
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                                        Expected Output
                                      </span>
                                      <div className="p-2 rounded bg-secondary-bg/90 border border-border font-mono text-xs font-semibold overflow-x-auto whitespace-pre-wrap">
                                        {runResult.testCaseResults[activeResultTestCaseIndex].expectedOutput}
                                      </div>
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                                        Actual Output
                                      </span>
                                      <div
                                        className={cn(
                                          'p-2 rounded border font-mono text-xs overflow-x-auto whitespace-pre-wrap',
                                          runResult.testCaseResults[activeResultTestCaseIndex].passed
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                        )}
                                      >
                                        {runResult.testCaseResults[activeResultTestCaseIndex].actualOutput || '(No output)'}
                                      </div>
                                    </div>

                                    {runResult.testCaseResults[activeResultTestCaseIndex].error && (
                                      <div className="space-y-1 sm:col-span-2">
                                        <span className="text-[10px] font-semibold uppercase text-rose-500 tracking-wider">
                                          Error Log
                                        </span>
                                        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 font-mono text-xs text-rose-600 dark:text-rose-400 whitespace-pre-wrap">
                                          {runResult.testCaseResults[activeResultTestCaseIndex].error}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Standard Output Log */}
                            {runResult.stdout && runResult.stdout.trim() && (
                              <div className="p-2.5 rounded-lg bg-[#080908] text-[#FAF8F3] font-mono text-xs space-y-1 whitespace-pre-wrap border border-border">
                                <div className="text-[10px] text-[#FAF8F3]/50 uppercase tracking-wider font-sans font-semibold">
                                  Standard Output (stdout)
                                </div>
                                <div className="text-[#FAF8F3]/90">{runResult.stdout}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Fallback raw text output if runResult not yet populated */}
                        {!runResult && testOutput && (
                          <div className="p-3 rounded-lg bg-[#080908] text-[#FAF8F3] font-mono text-xs space-y-1 whitespace-pre-wrap leading-relaxed border border-[#080908]">
                            <div className="text-[10px] text-[#FAF8F3]/50 uppercase tracking-wider font-sans font-semibold">
                              Execution Log
                            </div>
                            <div className="text-[#FAF8F3]/90">{testOutput}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              7. FIXED BOTTOM ACTION BAR
          ───────────────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 h-12 border-t border-border bg-card px-3 sm:px-4 flex items-center justify-between gap-3 select-none z-10 shadow-xs">
            {/* Left: Console toggle & Run Code Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary-bg hover:bg-muted border border-border text-foreground text-xs font-medium transition-colors cursor-pointer"
                title="Toggle Testcase / Results Console"
              >
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Console</span>
                {isConsoleOpen ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                )}
              </button>

              {!readOnly && (
                <button
                  type="button"
                  onClick={handleTestRun}
                  disabled={isTesting || !codeText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-secondary-bg hover:bg-muted border border-border text-foreground font-medium text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Check code syntax in sandbox"
                >
                  <Play className="w-3 h-3 text-foreground" />
                  <span>{isTesting ? 'Running...' : 'Run Code'}</span>
                </button>
              )}
            </div>

            {/* Right: Submit Code (or Read-Only badge) */}
            <div className="flex items-center gap-2">
              {readOnly ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submitted Code Review</span>
                  </span>
                  {persistedScore !== null && persistedScore !== undefined && (
                    <span className="text-xs font-mono font-bold text-foreground">
                      Score: {persistedScore}%
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!codeText.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#CDF22B] hover:bg-[#b8da25] text-[#080908] font-bold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#080908] border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating Solution...</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="w-4 h-4" />
                      <span>Submit Code</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          8. CONFIRMATION MODALS (Reset, Skip, End)
      ───────────────────────────────────────────────────────────── */}
      {/* Reset Code Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-[#080908]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-foreground" />
              <span>Reset Code to Template?</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to reset your solution? Your current edits will be replaced with the default boilerplate starter.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary-bg text-foreground text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetCode}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Reset Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Question Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 bg-[#080908]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <FastForward className="w-4 h-4 text-muted-foreground" />
              <span>Skip Coding Question?</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Skipping will advance to the next turn without submitting code for evaluation. This question will be marked as skipped in your performance report.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowSkipConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary-bg text-foreground text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSkipConfirm(false)
                  onSkip?.()
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#080908] text-xs font-bold cursor-pointer shadow-xs"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-[#080908]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>End Interview Session?</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to conclude the interview early? A comprehensive analytics report will be generated based on completed turns.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary-bg text-foreground text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndConfirm(false)
                  onEndEarly?.()
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
