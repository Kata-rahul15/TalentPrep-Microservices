import { useState, useEffect } from 'react'
import {
  Sparkles,
  FilePlus,
  Layers,
  LayoutTemplate,
  Check,
  X,
  FileText,
  ArrowRight,
} from 'lucide-react'
import type { ResumeFile, ResumeDetails } from '../../types/resume.types'
import type { ResumeTemplateId } from '../../types/builder.types'
import {
  TEMPLATE_REGISTRY,
  SAMPLE_PROFESSIONAL_RESUME,
  DEFAULT_EMPTY_RESUME,
} from '../../types/builder.types'
import { convertResumeDetailsToBuilderData } from '../../utils/builderUtils'
import { resumeApi } from '../../api/resumeApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelectFlow: (initialData: any, targetResumeId?: string) => void
  availableResumes?: ResumeFile[]
  currentResumeId?: string | null
}

type WorkflowTab = 'scratch' | 'import' | 'template'

export default function ResumeCreationModal({
  isOpen,
  onClose,
  onSelectFlow,
  availableResumes = [],
  currentResumeId,
}: Props) {
  const [activeTab, setActiveTab] = useState<WorkflowTab>(
    availableResumes.length > 0 ? 'import' : 'template'
  )
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('modern')
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    currentResumeId || availableResumes[0]?.id || ''
  )
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (currentResumeId && availableResumes.some((r) => r.id === currentResumeId)) {
        setSelectedResumeId(currentResumeId)
      } else if (availableResumes[0]?.id) {
        setSelectedResumeId(availableResumes[0].id)
      }
      setImportError(null)
      setIsImporting(false)
    }
  }, [isOpen, currentResumeId, availableResumes])

  if (!isOpen) return null

  // Handler for Option A: Scratch
  const handleStartFromScratch = () => {
    const data = JSON.parse(JSON.stringify(DEFAULT_EMPTY_RESUME))
    data.selectedTemplate = selectedTemplate
    onSelectFlow(data, undefined)
  }

  // Handler for Option B: Build from existing resume
  const handleImportExisting = async () => {
    if (!selectedResumeId) return
    setIsImporting(true)
    setImportError(null)

    try {
      const details: ResumeDetails = await resumeApi.getResumeDetails(selectedResumeId)
      const converted = convertResumeDetailsToBuilderData(details)
      converted.selectedTemplate = selectedTemplate
      onSelectFlow(converted, selectedResumeId)
    } catch (err: any) {
      console.error('[ResumeBuilder] Failed to import resume details:', err)
      setImportError('Could not parse resume details. You can start from a template instead.')
    } finally {
      setIsImporting(false)
    }
  }

  // Handler for Option C: Template + Starter Sample
  const handleStartFromTemplate = (includeSample = true) => {
    const base = includeSample ? SAMPLE_PROFESSIONAL_RESUME : DEFAULT_EMPTY_RESUME
    const data = JSON.parse(JSON.stringify(base))
    data.selectedTemplate = selectedTemplate
    onSelectFlow(data, undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Create / Import Resume
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose an uploaded resume or start with a pre-formatted template.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Import Uploaded</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'template'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Choose Template</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scratch')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scratch'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>From Scratch</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ── TAB 1: Import from Uploaded Resume ── */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {availableResumes.length === 0 ? (
                <div className="text-center py-8 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                    No uploaded resumes found
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    You haven&apos;t uploaded any resumes yet. You can choose a template or build from scratch.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('template')}
                    className="text-xs font-bold text-blue-600 hover:underline pt-2 inline-block cursor-pointer"
                  >
                    Choose a Template Instead
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Select an uploaded resume. The builder will automatically populate with its structured sections:
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableResumes.map((r) => (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedResumeId === r.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="resumeChoice"
                            value={r.id}
                            checked={selectedResumeId === r.id}
                            onChange={() => setSelectedResumeId(r.id)}
                            className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {r.fileName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Uploaded {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                          {r.status}
                        </span>
                      </label>
                    ))}
                  </div>

                  {importError && (
                    <p className="text-xs text-rose-500 bg-rose-50 p-2 rounded-lg">
                      {importError}
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      disabled={isImporting || !selectedResumeId}
                      onClick={handleImportExisting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border disabled:border-border disabled:cursor-not-allowed rounded-xl shadow-xs cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          <span>Importing & Parsing...</span>
                        </>
                      ) : (
                        <>
                          <span>Load Structured Data</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Template Selection ── */}
          {activeTab === 'template' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMPLATE_REGISTRY.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                      selectedTemplate === tpl.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tpl.badge}
                      </span>
                      {selectedTemplate === tpl.id && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <div className="font-heading font-bold text-xs text-slate-900 dark:text-white truncate">
                      {tpl.name}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                      {tpl.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleStartFromTemplate(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Start with Empty Form
                </button>
                <button
                  type="button"
                  onClick={() => handleStartFromTemplate(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start with Sample Content</span>
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 3: Start from Scratch ── */}
          {activeTab === 'scratch' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200/60">
                <FilePlus className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Blank Slate Resume
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Start with clean, structured sections and fill in your details step-by-step with real-time previewing.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleStartFromScratch}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  <span>Create Blank Resume</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
