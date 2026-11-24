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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080908]/70 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-foreground">
              Create / Import Resume
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose an uploaded resume or start with a pre-formatted template.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary-bg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="grid grid-cols-3 border-b border-border bg-secondary-bg/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-[#080908] text-[#CDF22B] shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
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
                ? 'bg-[#080908] text-[#CDF22B] shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
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
                ? 'bg-[#080908] text-[#CDF22B] shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
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
                <div className="text-center py-8 space-y-2 border border-dashed border-border rounded-xl p-4">
                  <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="font-semibold text-xs text-foreground">
                    No uploaded resumes found
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    You haven&apos;t uploaded any resumes yet. You can choose a template or build from scratch.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('template')}
                    className="text-xs font-bold text-foreground hover:underline pt-2 inline-block cursor-pointer"
                  >
                    Choose a Template Instead
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Select an uploaded resume. The builder will automatically populate with its structured sections:
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableResumes.map((r) => (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedResumeId === r.id
                            ? 'border-[#080908] bg-[#080908]/5 dark:border-[#CDF22B]'
                            : 'border-border hover:bg-secondary-bg/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="radio"
                            name="resumeChoice"
                            value={r.id}
                            checked={selectedResumeId === r.id}
                            onChange={() => setSelectedResumeId(r.id)}
                            className="text-[#080908] focus:ring-[#080908] cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-foreground truncate">
                              {r.fileName}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              Uploaded {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-secondary-bg text-foreground border border-border">
                          {r.status}
                        </span>
                      </label>
                    ))}
                  </div>

                  {importError && (
                    <p className="text-xs text-red-600 bg-red-500/10 p-2 rounded-lg">
                      {importError}
                    </p>
                  )}

                  <div className="pt-3 border-t border-border flex justify-end">
                    <button
                      type="button"
                      disabled={isImporting || !selectedResumeId}
                      onClick={handleImportExisting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#bce022] disabled:bg-secondary-bg disabled:text-muted-foreground disabled:border disabled:border-border disabled:cursor-not-allowed rounded-xl shadow-xs cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#080908] border-t-transparent rounded-full animate-spin flex-shrink-0" />
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
                        ? 'border-[#080908] bg-[#080908]/5 dark:border-[#CDF22B] ring-1 ring-[#080908] dark:ring-[#CDF22B]'
                        : 'border-border hover:border-[#080908]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-secondary-bg text-foreground">
                        {tpl.badge}
                      </span>
                      {selectedTemplate === tpl.id && (
                        <Check className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
                      )}
                    </div>
                    <div className="font-heading font-bold text-xs text-foreground truncate">
                      {tpl.name}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                      {tpl.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleStartFromTemplate(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary-bg rounded-xl cursor-pointer"
                >
                  Start with Empty Form
                </button>
                <button
                  type="button"
                  onClick={() => handleStartFromTemplate(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#bce022] rounded-xl shadow-xs cursor-pointer"
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
              <div className="w-12 h-12 rounded-2xl bg-[#080908]/5 text-[#080908] flex items-center justify-center mx-auto border border-border">
                <FilePlus className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Blank Slate Resume
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start with clean, structured sections and fill in your details step-by-step with real-time previewing.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleStartFromScratch}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#bce022] rounded-xl shadow-xs cursor-pointer"
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
