import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Download,
  LayoutTemplate,
  Undo2,
  Redo2,
  Check,
  Clock,
  AlertCircle,
  Eye,
  Edit3,
  Layers,
  Plus,
} from 'lucide-react'
import type { ResumeTemplateId } from '../../types/builder.types'
import type { ResumeFile } from '../../types/resume.types'
import { TEMPLATE_REGISTRY } from '../../types/builder.types'

interface Props {
  documentTitle: string
  onTitleChange: (title: string) => void
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  selectedTemplate: ResumeTemplateId
  onOpenTemplateGallery: () => void
  onSaveDraft: () => void
  onDownloadPdf: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  mobileViewMode?: 'edit' | 'preview'
  onToggleMobileView?: (mode: 'edit' | 'preview') => void
  availableResumes?: ResumeFile[]
  selectedResumeId?: string | null
  onSelectResume?: (resumeId: string) => void
  onOpenCreationModal?: () => void
}

export default function ResumeBuilderToolbar({
  documentTitle,
  onTitleChange,
  saveStatus,
  selectedTemplate,
  onOpenTemplateGallery,
  onSaveDraft,
  onDownloadPdf,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  mobileViewMode,
  onToggleMobileView,
  availableResumes = [],
  selectedResumeId,
  onSelectResume,
  onOpenCreationModal,
}: Props) {
  const navigate = useNavigate()
  const currentTemplate = TEMPLATE_REGISTRY.find((t) => t.id === selectedTemplate)

  return (
    <header className="bg-card border border-border rounded-xl px-3.5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-2xs">
      {/* ── Left side: Back button & Resume Switcher & Editable Title ── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={() => navigate('/resume')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-[#080908] dark:hover:text-[#CDF22B] transition-colors p-1.5 rounded-lg hover:bg-secondary-bg cursor-pointer flex-shrink-0"
          title="Back to Resume Workspace"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Workspace</span>
        </button>

        <span className="text-border hidden sm:inline">|</span>

        {/* Resume Selector dropdown if multiple resumes exist */}
        {availableResumes.length > 1 && onSelectResume && (
          <div className="flex items-center gap-1 bg-secondary-bg/60 border border-border rounded-lg px-2 py-1 flex-shrink-0">
            <Layers className="w-3 h-3 text-[#080908] dark:text-[#CDF22B]" />
            <select
              value={selectedResumeId || ''}
              onChange={(e) => onSelectResume(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-foreground focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              {availableResumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fileName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Editable Document Title */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Resume"
            className="font-heading font-bold text-xs sm:text-sm text-foreground bg-transparent border border-transparent hover:border-border focus:border-[#080908] rounded px-1.5 py-0.5 focus:outline-none truncate max-w-xs transition-colors"
          />

          {/* Save Status Badge */}
          <div className="flex items-center gap-1 text-[11px] font-mono font-medium flex-shrink-0">
            {saveStatus === 'saved' && (
              <span className="text-foreground inline-flex items-center gap-0.5" title="Saved locally and synced to backend">
                <Check className="w-3 h-3 text-[#080908] dark:text-[#CDF22B]" />
                <span className="hidden lg:inline">Saved</span>
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-muted-foreground inline-flex items-center gap-0.5">
                <Clock className="w-3 h-3 animate-spin text-[#080908] dark:text-[#CDF22B]" />
                <span className="hidden lg:inline">Saving...</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-amber-700 inline-flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" />
                <span className="hidden lg:inline">Unsaved changes</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 inline-flex items-center gap-0.5" title="Saved in local cache, network sync pending">
                <AlertCircle className="w-3 h-3" />
                <span className="hidden lg:inline">Saved locally</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Right side: Undo/Redo, Template Picker, Actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-wrap">
        {/* Mobile Edit/Preview Toggle */}
        {onToggleMobileView && (
          <div className="flex items-center bg-secondary-bg p-0.5 rounded-lg xl:hidden">
            <button
              type="button"
              onClick={() => onToggleMobileView('edit')}
              className={`p-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                mobileViewMode === 'edit'
                  ? 'bg-card text-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMobileView('preview')}
              className={`p-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                mobileViewMode === 'preview'
                  ? 'bg-card text-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        )}

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5 border-r border-border pr-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-secondary-bg cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-secondary-bg cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Create / Import button */}
        {onOpenCreationModal && (
          <button
            type="button"
            onClick={onOpenCreationModal}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-lg hover:bg-secondary-bg transition-colors shadow-2xs cursor-pointer h-7.5"
            title="Create new or import another resume"
          >
            <Plus className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
            <span className="hidden lg:inline">New / Import</span>
          </button>
        )}

        {/* Template Gallery Button */}
        <button
          type="button"
          onClick={onOpenTemplateGallery}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-lg hover:bg-secondary-bg transition-colors shadow-2xs cursor-pointer h-7.5"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-[#080908] dark:text-[#CDF22B]" />
          <span>{currentTemplate?.name || 'Templates'}</span>
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          disabled={saveStatus === 'saving'}
          onClick={onSaveDraft}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-card border border-border rounded-lg hover:bg-secondary-bg disabled:bg-secondary-bg disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95 cursor-pointer h-7.5"
        >
          {saveStatus === 'saving' ? (
            <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <Save className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className="hidden sm:inline">{saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}</span>
        </button>

        {/* Download PDF Button */}
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#bce022] active:scale-95 rounded-lg transition-all shadow-2xs cursor-pointer h-7.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>
      </div>
    </header>
  )
}
