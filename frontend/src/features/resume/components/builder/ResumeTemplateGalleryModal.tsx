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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080908]/70 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-[#080908] dark:text-[#CDF22B]" />
            <div>
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-foreground">
                Resume Template Gallery
              </h2>
              <p className="text-xs text-muted-foreground">
                Switch templates anytime. Your content and structure will be 100% preserved.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary-bg cursor-pointer"
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
                    ? 'border-[#080908] bg-[#080908]/5 dark:border-[#CDF22B] ring-2 ring-[#080908] dark:ring-[#CDF22B]'
                    : 'border-border hover:border-[#080908]/40 bg-card shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-secondary-bg text-foreground">
                      {tpl.badge}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#080908] dark:text-[#CDF22B]">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-[#080908] dark:group-hover:text-[#CDF22B] transition-colors">
                    {tpl.name}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#383B36] dark:text-[#BDB9AF] block mb-0.5">
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
