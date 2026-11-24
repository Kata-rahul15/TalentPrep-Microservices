import { useState, useEffect } from 'react'
import type { ResumeBuilderData } from '../../types/builder.types'
import TemplateRenderer from '../../templates/TemplateRenderer'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, ArrowLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  data: ResumeBuilderData
  className?: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  embedded?: boolean
}

export default function ResumePreview({
  data,
  className,
  isFullscreen = false,
  onToggleFullscreen,
  embedded = false,
}: Props) {
  const [zoomLevel, setZoomLevel] = useState<number>(0.9)

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))
  const handleResetZoom = () => setZoomLevel(0.9)

  // Escape key closes fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && onToggleFullscreen) {
        onToggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, onToggleFullscreen])

  // Prevent background scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  // ── 1. Fullscreen Preview Mode (Fixed Viewport Overlay) ──
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-[100dvh] flex flex-col bg-slate-950/95 backdrop-blur-md overflow-hidden">
        {/* Fullscreen Sticky Top Toolbar (Close Button Always Visible) */}
        <header className="h-14 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white flex-shrink-0 z-20 shadow-md">
          {/* Back / Close button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer border border-white/15 shadow-2xs"
            title="Exit Fullscreen Preview"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Editor</span>
          </button>

          {/* Center Info Title */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-heading font-bold text-sm text-slate-100">
              Live Resume Preview
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              A4 • {data.selectedTemplate}
            </span>
          </div>

          {/* Right Zoom Controls & Close X */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-200 w-11 text-center select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              title="Reset Zoom (90%)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Independent Scroll Area with Centered A4 Sheet */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-6 sm:p-10 flex justify-center items-start scrollbar-thin">
          <div
            id="resume-printable-area"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              width: '210mm',
              minHeight: '297mm',
              marginBottom: '40px',
            }}
            className="bg-white text-slate-900 shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-sm transition-transform duration-150 relative print:shadow-none print:border-none print:transform-none print:w-full print:m-0"
          >
            <TemplateRenderer data={data} />
          </div>
        </div>
      </div>
    )
  }

  // ── 2. Normal 3-Column View Mode ──
  return (
    <div
      className={cn(
        'flex flex-col bg-slate-100/90 dark:bg-slate-950 overflow-hidden transition-all h-full w-full',
        !embedded &&
          'border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs h-[calc(100dvh-130px)] min-h-[640px]',
        className
      )}
    >
      {/* Normal Preview Header Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-slate-800 dark:text-slate-200">
            Live Preview
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 uppercase">
            A4 • {data.selectedTemplate}
          </span>
        </div>

        {/* Zoom & Fullscreen Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 w-10 text-center select-none">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Reset Zoom (90%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-1 transition-colors"
              title="Fullscreen Preview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Document Surface (Centered A4 Canvas) */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start scrollbar-thin">
        <div
          id="resume-printable-area"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            width: '210mm',
            minHeight: '297mm',
            marginBottom: '30px',
          }}
          className="bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200/80 rounded-sm transition-transform duration-150 relative print:shadow-none print:border-none print:transform-none print:w-full print:m-0"
        >
          <TemplateRenderer data={data} />
        </div>
      </div>
    </div>
  )
}
