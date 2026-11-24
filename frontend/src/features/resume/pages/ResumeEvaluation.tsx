import { motion } from 'framer-motion'
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Tag,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { useResume, useResumeEvaluation, useEvaluateResume } from '../hooks/useResume'
import { useResumeContext } from '../context/ResumeContext'
import { PageError, Button } from '../components/ResumeUI'
import { SkeletonResumeEvaluation } from '../components/ResumeSkeletons'
import ScoreBar from '../components/ScoreBar'
import { ScoreRingContainer } from '../components/ScoreRing'
import SkillBadge from '../components/SkillBadge'
import type { ResumeSuggestion } from '../types/resume.types'

const priorityStyles = {
  high: 'bg-danger/10 text-danger border-danger/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-primary/10 text-primary border-primary/20',
}

function SuggestionCard({ suggestion }: { suggestion: ResumeSuggestion }) {
  return (
    <div className="flex gap-2.5 p-3 bg-card border border-border rounded-lg">
      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex-shrink-0 h-fit ${priorityStyles[suggestion.priority]}`}>
        {suggestion.priority}
      </span>
      <div>
        <p className="text-xs font-semibold text-foreground mb-0.5 leading-tight">{suggestion.section}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.message}</p>
      </div>
    </div>
  )
}

export default function ResumeEvaluation() {
  const { selectedResumeId } = useResumeContext()
  const { data: resumeFile } = useResume(selectedResumeId)
  const { data: evaluation, isLoading, isError, refetch } = useResumeEvaluation(selectedResumeId)
  const evaluateMutation = useEvaluateResume(selectedResumeId)

  const handleReevaluate = async () => {
    await evaluateMutation.mutateAsync()
  }

  if (resumeFile?.status === 'processing') {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="font-heading font-bold text-base sm:text-lg text-foreground">Processing ATS Evaluation...</h2>
        <p className="text-xs text-muted-foreground">
          Our AI is currently performing ATS score calculation and keyword analysis. Evaluation will appear once processing completes.
        </p>
      </div>
    )
  }

  if (isLoading) return <SkeletonResumeEvaluation />
  if (isError || !evaluation) return <PageError message="Could not load ATS evaluation." onRetry={refetch} />

  const { scores, strengths = [], weaknesses = [], suggestions = [], missingKeywords = [] } = evaluation

  const scoreBreakdownItems = [
    { label: 'ATS Score', score: scores?.atsScore ?? 0 },
    { label: 'Keyword Match', score: scores?.keywordMatch ?? 0 },
    { label: 'Formatting', score: scores?.formattingScore ?? 0 },
    { label: 'Technical Skills', score: scores?.technicalSkillsScore ?? 0 },
    { label: 'Experience', score: scores?.experienceScore ?? 0 },
    { label: 'Education', score: scores?.educationScore ?? 0 },
  ]

  const overallScore = scores?.overallScore ?? 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-2.5"
      >
        <div>
          <h1 className="font-heading font-black text-lg sm:text-xl text-foreground leading-tight">ATS Evaluation</h1>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">AI-powered resume score breakdown and improvement plan</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReevaluate}
          loading={evaluateMutation.isPending}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-evaluate
        </Button>
      </motion.div>

      {/* Overall Score + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Overall Score Ring */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center gap-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overall Score</p>
          <ScoreRingContainer score={overallScore} size="lg" label="/ 100" />
          <div className="text-center">
            <p className={`font-heading font-bold text-xs sm:text-sm ${
              overallScore >= 80 ? 'text-success' : overallScore >= 60 ? 'text-warning' : 'text-danger'
            }`}>
              {overallScore >= 80 ? 'Strong Profile' : overallScore >= 60 ? 'Needs Improvement' : 'Weak Profile'}
            </p>
            {evaluation.evaluatedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Evaluated {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(evaluation.evaluatedAt))}
              </p>
            )}
          </div>
        </motion.div>

        {/* Score Breakdown bars */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2.5"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Score Breakdown
          </p>
          {scoreBreakdownItems.map((item) => (
            <ScoreBar key={item.label} label={item.label} score={item.score} />
          ))}
        </motion.div>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Strengths
          </h3>
          {strengths.length > 0 ? (
            <ul className="space-y-1.5">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No specific strengths highlighted.</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Weaknesses
          </h3>
          {weaknesses.length > 0 ? (
            <ul className="space-y-1.5">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-secondary-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No specific weaknesses identified.</p>
          )}
        </motion.div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
            <Lightbulb className="w-3.5 h-3.5 text-primary" /> Improvement Suggestions
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <SuggestionCard key={i} suggestion={suggestion} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Missing Keywords */}
      {missingKeywords.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h3 className="font-heading font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 mb-2.5">
            <Tag className="w-3.5 h-3.5 text-danger" /> Missing Keywords
            <span className="ml-auto text-[11px] text-muted-foreground font-normal">Add these to boost your ATS score</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.map((kw) => (
              <SkillBadge key={kw} label={kw} variant="missing" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Upgrade CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-slate-950 text-white rounded-xl p-4 sm:p-5 flex items-center gap-3.5 flex-wrap"
      >
        <TrendingUp className="w-6 h-6 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-xs sm:text-sm mb-0.5">Optimize your ATS score</p>
          <p className="text-slate-400 text-xs leading-relaxed">Apply the suggestions above to significantly boost your resume ranking in automated tracking systems.</p>
        </div>
      </motion.div>
    </div>
  )
}
