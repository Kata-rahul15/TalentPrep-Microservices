import type {
  ResumeTemplateId,
} from '../../types/builder.types'
import { TEMPLATE_REGISTRY } from '../../types/builder.types'
import { X, Check, LayoutTemplate } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentTemplate: ResumeTemplateId
  onSelectTemplate: (templateId: ResumeTemplateId) => void
}

export default function ResumeTemplateGalleryModal({
  isOpen,
  onClose,
  currentTemplate,
  onSelectTemplate,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Resume Template Gallery
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch templates anytime. Your content and structure will be 100% preserved.
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

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[70vh] overflow-y-auto">
          {TEMPLATE_REGISTRY.map((tpl) => {
            const isSelected = currentTemplate === tpl.id

            return (
              <div
                key={tpl.id}
                onClick={() => {
                  onSelectTemplate(tpl.id)
                  onClose()
                }}
                className={`group p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-2 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tpl.badge}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {tpl.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Best For:
                  </span>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {tpl.bestFor}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
