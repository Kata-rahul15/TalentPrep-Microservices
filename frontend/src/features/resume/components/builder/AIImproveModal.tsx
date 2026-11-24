import { useState, useEffect } from 'react'
import { Sparkles, Check, X, RefreshCw, AlertCircle, Edit2 } from 'lucide-react'
import { resumeApi } from '../../api/resumeApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  originalText: string
  contextLabel: string
  onAcceptSuggestion: (improvedText: string) => void
  resumeId?: string | null
}

export default function AIImproveModal({
  isOpen,
  onClose,
  originalText,
  contextLabel,
  onAcceptSuggestion,
  resumeId,
}: Props) {
  const [suggestion, setSuggestion] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setSuggestion('')
      setError(null)
      setHasGenerated(false)
      setIsLoading(false)
    }
  }, [isOpen, originalText])

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!originalText.trim()) {
      setError('Original text cannot be empty. Please enter some draft text first.')
      return
    }

    setIsLoading(true)
    setError(null)

    // Strictly grounded prompt preventing hallucinated companies, metrics, or technologies
    const prompt = `You are a professional resume optimization AI.
Your task is to rewrite and polish the following resume text to make it more impactful, concise, professional, and ATS-friendly with strong action verbs and clean phrasing.

CRITICAL INSTRUCTIONS:
1. Ground your rewrite STRICTLY in the provided text and context.
2. DO NOT invent fake employers, companies, metrics, numbers, technologies, projects, or achievements that were not mentioned.
3. Keep the factual details accurate while improving readability, tone, and grammar.
4. Return ONLY the polished resume text directly without introductory commentary or conversational preamble.

Context: ${contextLabel}
Current Text: "${originalText}"`

    try {
      if (!resumeId) throw new Error('Create or select a resume before using AI improvement.')
      const response = await resumeApi.chat(resumeId, prompt)
      let cleaned = (response.content || '').trim()

      // Remove enclosing quotes if returned
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1)
      }
      setSuggestion(cleaned)
      setHasGenerated(true)
    } catch (err: any) {
      console.error('[ResumeBuilder:AIImprove] AI improvement request failed:', err)
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to connect to AI Assistant. Please check your network connection or try again later.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = () => {
    if (suggestion) {
      onAcceptSuggestion(suggestion)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                AI Resume Polish & Enhancement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enhancing {contextLabel} with grounded, high-impact phrasing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Draft */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Draft
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {originalText.length} chars
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 min-h-[140px] max-h-[220px] overflow-y-auto leading-relaxed">
                {originalText || (
                  <span className="text-slate-400 italic">No text provided to improve.</span>
                )}
              </div>
            </div>

            {/* AI Suggestion (Editable) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Suggestion
                </span>
                {suggestion && (
                  <span className="text-[10px] text-blue-500 font-mono flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5" /> Editable ({suggestion.length} chars)
                  </span>
                )}
              </div>
              <div className="relative">
                {isLoading ? (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-xl text-xs flex flex-col items-center justify-center min-h-[140px] max-h-[220px] text-center space-y-2">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-xs text-blue-600 font-semibold">
                      Generating high-impact suggestion...
                    </span>
                  </div>
                ) : suggestion ? (
                  <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 min-h-[140px] max-h-[220px] leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="AI suggested text..."
                  />
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs min-h-[140px] max-h-[220px] flex flex-col items-center justify-center text-center space-y-1 text-slate-400">
                    <Sparkles className="w-6 h-6 opacity-40 mb-1" />
                    <span>Click &quot;Generate AI Suggestion&quot; to begin.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            disabled={isLoading || !originalText.trim()}
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900 rounded-xl hover:bg-blue-50 transition-colors shadow-2xs disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border-border disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? 'Generating...' : hasGenerated ? 'Regenerate' : 'Generate AI Suggestion'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!suggestion || isLoading}
              onClick={handleAccept}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border disabled:border-border disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
