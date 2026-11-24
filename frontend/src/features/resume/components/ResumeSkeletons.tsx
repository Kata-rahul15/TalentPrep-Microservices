import { cn } from '@/lib/utils'

export function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-slate-200/80 dark:bg-slate-800 animate-pulse rounded-md',
        className
      )}
    />
  )
}

/**
 * 4 Horizontal Score Summary Cards Skeleton
 */
export function SkeletonScoreCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs"
        >
          {/* Score ring skeleton */}
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 animate-pulse flex-shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <SkeletonBox className="h-3 w-16" />
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-2.5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * AI Resume Insights Card Skeleton
 */
export function SkeletonAIInsights() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-4 h-4 rounded-full" />
          <SkeletonBox className="h-4 w-36" />
        </div>
      </div>

      <div className="space-y-2">
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-11/12" />
        <SkeletonBox className="h-3.5 w-4/5" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="space-y-2.5">
          <SkeletonBox className="h-3.5 w-28" />
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <SkeletonBox className="w-3.5 h-3.5 rounded-full flex-shrink-0" />
              <SkeletonBox className="h-3 w-4/5" />
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <SkeletonBox className="h-3.5 w-32" />
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <SkeletonBox className="w-3.5 h-3.5 rounded-full flex-shrink-0" />
              <SkeletonBox className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <SkeletonBox className="h-3.5 w-32" />
      </div>
    </div>
  )
}

/**
 * Next Best Actions Skeleton
 */
export function SkeletonNextActions() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-2xs">
      <div className="flex items-center gap-2 mb-1">
        <SkeletonBox className="w-4 h-4 rounded-full" />
        <SkeletonBox className="h-4 w-40" />
      </div>

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <SkeletonBox className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <SkeletonBox className="h-3 w-28" />
              <SkeletonBox className="h-2.5 w-44" />
            </div>
          </div>
          <SkeletonBox className="w-4 h-4 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

/**
 * AI Career Agent Widget Skeleton
 */
export function SkeletonAIAgentWidget() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-4 h-4 rounded-full" />
          <SkeletonBox className="h-4 w-32" />
        </div>
        <SkeletonBox className="h-4 w-14 rounded-full" />
      </div>

      {/* Message bubble */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
        <SkeletonBox className="h-3 w-full" />
        <SkeletonBox className="h-3 w-4/5" />
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBox key={i} className="h-7 w-full rounded-lg" />
        ))}
      </div>

      {/* Input bar */}
      <SkeletonBox className="h-9 w-full rounded-xl" />
    </div>
  )
}

/**
 * Recommended Jobs Section Skeleton
 */
export function SkeletonRecommendedJobs() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonBox className="h-4 w-44" />
          <SkeletonBox className="h-3 w-64" />
        </div>
        <SkeletonBox className="h-4 w-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-18 rounded-full" />
              <SkeletonBox className="h-4 w-40" />
              <SkeletonBox className="h-3 w-28" />
              <div className="flex gap-2 pt-1">
                <SkeletonBox className="h-3 w-16" />
                <SkeletonBox className="h-3 w-16" />
                <SkeletonBox className="h-3 w-16" />
              </div>
              <div className="flex gap-1.5 pt-1.5">
                <SkeletonBox className="h-5 w-12 rounded" />
                <SkeletonBox className="h-5 w-16 rounded" />
                <SkeletonBox className="h-5 w-14 rounded" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <SkeletonBox className="h-3.5 w-16" />
              <SkeletonBox className="h-3.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full Page Skeleton for Resume Overview Dashboard
 */
export function SkeletonResumeOverview() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top File Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-4.5 w-48" />
              <SkeletonBox className="h-4 w-14 rounded-full" />
            </div>
            <SkeletonBox className="h-3 w-60" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SkeletonBox className="h-8 w-28 rounded-lg" />
          <SkeletonBox className="h-8 w-24 rounded-lg" />
          <SkeletonBox className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* 4 Score Gauge Cards */}
      <SkeletonScoreCards />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 8 cols */}
        <div className="lg:col-span-8 space-y-4">
          <SkeletonAIInsights />
          <SkeletonRecommendedJobs />
        </div>

        {/* Right 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <SkeletonNextActions />
          <SkeletonAIAgentWidget />
        </div>
      </div>
    </div>
  )
}

/**
 * Resume Details Page Skeleton
 */
export function SkeletonResumeDetails() {
  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      <div className="space-y-1">
        <SkeletonBox className="h-5 w-40" />
        <SkeletonBox className="h-3.5 w-72" />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
        <SkeletonBox className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-4.5 w-52" />
          <div className="flex gap-4">
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-3 w-28" />
            <SkeletonBox className="h-3 w-32" />
          </div>
        </div>
      </div>

      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-36" />
            <SkeletonBox className="w-4 h-4 rounded" />
          </div>
          <SkeletonBox className="h-3.5 w-full" />
          <SkeletonBox className="h-3.5 w-4/5" />
        </div>
      ))}
    </div>
  )
}

/**
 * ATS Evaluation Page Skeleton
 */
export function SkeletonResumeEvaluation() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-3.5 w-64" />
        </div>
        <SkeletonBox className="h-8 w-24 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <SkeletonBox className="h-3 w-20" />
          <div className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-800 animate-pulse" />
          <SkeletonBox className="h-4 w-28" />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-2xs">
          <SkeletonBox className="h-3 w-32" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <SkeletonBox className="h-3 w-24" />
                <SkeletonBox className="h-3 w-10" />
              </div>
              <SkeletonBox className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-2xs">
          <SkeletonBox className="h-4 w-28" />
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} className="h-3 w-full" />
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-2xs">
          <SkeletonBox className="h-4 w-28" />
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Resume Builder Skeleton
 */
export function SkeletonResumeBuilder() {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-7 w-20 rounded-lg" />
          <SkeletonBox className="h-7 w-48 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-7 w-24 rounded-lg" />
          <SkeletonBox className="h-7 w-24 rounded-lg" />
          <SkeletonBox className="h-7 w-28 rounded-lg" />
        </div>
      </div>

      {/* 3 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Sidebar (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2 shadow-2xs">
          <SkeletonBox className="h-3 w-20 mb-3" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SkeletonBox key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>

        {/* Center Editor (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-2xs min-h-[540px]">
          <SkeletonBox className="h-4 w-36 mb-4" />
          <div className="space-y-3">
            <SkeletonBox className="h-9 w-full rounded-lg" />
            <SkeletonBox className="h-9 w-full rounded-lg" />
            <SkeletonBox className="h-24 w-full rounded-lg" />
            <SkeletonBox className="h-9 w-full rounded-lg" />
          </div>
        </div>

        {/* Right Live Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-2xs min-h-[540px] flex flex-col items-center justify-start">
          <div className="w-full flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-4 w-20" />
          </div>
          <div className="w-4/5 h-[460px] bg-white dark:bg-slate-900 rounded-sm shadow-md border border-slate-200/60 p-6 space-y-3">
            <SkeletonBox className="h-6 w-48 mx-auto" />
            <SkeletonBox className="h-3 w-36 mx-auto" />
            <div className="pt-4 space-y-2">
              <SkeletonBox className="h-3.5 w-24" />
              <SkeletonBox className="h-2.5 w-full" />
              <SkeletonBox className="h-2.5 w-full" />
              <SkeletonBox className="h-2.5 w-3/4" />
            </div>
            <div className="pt-3 space-y-2">
              <SkeletonBox className="h-3.5 w-28" />
              <SkeletonBox className="h-2.5 w-full" />
              <SkeletonBox className="h-2.5 w-4/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Job Cards List Skeleton for Job Explorer
 */
export function SkeletonJobList() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <SkeletonBox className="h-4 w-48" />
              <SkeletonBox className="h-3 w-32" />
            </div>
            <SkeletonBox className="h-5 w-12 rounded-full" />
          </div>
          <div className="flex gap-3">
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
