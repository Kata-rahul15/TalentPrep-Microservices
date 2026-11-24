import { Sparkles } from 'lucide-react'

interface Props {
  summary: string
  onChange: (summary: string) => void
  onImproveWithAI: (currentText: string, context: string) => void
}

export default function SummaryEditor({ summary, onChange, onImproveWithAI }: Props) {
  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0
  const charCount = summary.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Professional Summary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Summarize your core strengths, years of experience, and key achievements in 2–4 concise sentences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onImproveWithAI(summary, 'Professional Summary')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer h-7"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Improve with AI</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <textarea
          rows={6}
          value={summary}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Results-driven Senior Software Engineer with 6+ years of experience designing and scaling microservices in cloud environments. Proven track record of improving system uptime to 99.99% and mentoring high-performing engineering teams."
          className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Target length: 40–80 words (3–4 sentences)</span>
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>
        </div>
      </div>
    </div>
  )
}
