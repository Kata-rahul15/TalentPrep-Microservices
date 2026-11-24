import type { CustomSectionItem } from '../../types/builder.types'
import { generateId } from '../../utils/builderUtils'
import { Plus, Trash2, Layers } from 'lucide-react'

interface Props {
  customSections: CustomSectionItem[]
  onChange: (sections: CustomSectionItem[]) => void
}

export default function CustomSectionEditor({ customSections, onChange }: Props) {
  const addSection = () => {
    const newSec: CustomSectionItem = {
      id: generateId('cust'),
      title: 'Publications & Speaking',
      items: [''],
    }
    onChange([...customSections, newSec])
  }

  const updateTitle = (id: string, title: string) => {
    onChange(customSections.map((s) => (s.id === id ? { ...s, title } : s)))
  }

  const removeSection = (id: string) => {
    onChange(customSections.filter((s) => s.id !== id))
  }

  const addItemToSection = (id: string) => {
    const target = customSections.find((s) => s.id === id)
    if (!target) return
    onChange(
      customSections.map((s) => (s.id === id ? { ...s, items: [...s.items, ''] } : s))
    )
  }

  const updateSectionItem = (id: string, itemIdx: number, value: string) => {
    const target = customSections.find((s) => s.id === id)
    if (!target) return
    const updated = [...target.items]
    updated[itemIdx] = value
    onChange(
      customSections.map((s) => (s.id === id ? { ...s, items: updated } : s))
    )
  }

  const removeSectionItem = (id: string, itemIdx: number) => {
    const target = customSections.find((s) => s.id === id)
    if (!target) return
    const updated = target.items.filter((_, idx) => idx !== itemIdx)
    onChange(
      customSections.map((s) =>
        s.id === id ? { ...s, items: updated.length > 0 ? updated : [''] } : s
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Custom Sections
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add custom sections like Publications, Languages, Volunteer Work, or Leadership.
          </p>
        </div>

        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer h-7.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Section</span>
        </button>
      </div>

      {customSections.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No custom sections created
          </p>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
          >
            <Plus className="w-3 h-3" /> Add a custom section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customSections.map((sec) => (
            <div
              key={sec.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => updateTitle(sec.id, e.target.value)}
                  placeholder="Section Title (e.g. Volunteer Experience)"
                  className="font-heading font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 py-0.5 px-1 flex-1 max-w-xs"
                />

                <button
                  type="button"
                  onClick={() => removeSection(sec.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Remove section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Section Entries / Highlights
                  </label>
                  <button
                    type="button"
                    onClick={() => addItemToSection(sec.id)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Add Entry
                  </button>
                </div>

                {sec.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-xs font-bold">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateSectionItem(sec.id, itemIdx, e.target.value)}
                      placeholder="e.g. Keynote Speaker at CloudNative Global Summit 2023"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeSectionItem(sec.id, itemIdx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
