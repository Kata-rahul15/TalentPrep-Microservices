import type { EducationItem } from '../../types/builder.types'
import { generateId } from '../../utils/builderUtils'
import { Plus, Trash2, GraduationCap, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  education: EducationItem[]
  onChange: (education: EducationItem[]) => void
}

export default function EducationEditor({ education, onChange }: Props) {
  const addEducation = () => {
    const newItem: EducationItem = {
      id: generateId('edu'),
      institution: '',
      degree: '',
      field: '',
      location: '',
      startYear: '',
      graduationYear: '',
      gpa: '',
      coursework: '',
    }
    onChange([...education, newItem])
  }

  const updateItem = (id: string, updates: Partial<EducationItem>) => {
    onChange(education.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)))
  }

  const removeItem = (id: string) => {
    onChange(education.filter((edu) => edu.id !== id))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= education.length) return
    const updated = [...education]
    const temp = updated[index]
    updated[index] = updated[newIdx]
    updated[newIdx] = temp
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Education
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add degrees, certifications, institutions, and relevant academic highlights.
          </p>
        </div>

        <button
          type="button"
          onClick={addEducation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer h-7.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Education</span>
        </button>
      </div>

      {education.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2">
          <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No education entries yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Click &quot;Add Education&quot; to list your university degrees, diplomas, or academic institutions.
          </p>
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
          >
            <Plus className="w-3 h-3" /> Add education
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {education.map((edu, idx) => (
            <div
              key={edu.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-2xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  {edu.degree || edu.institution ? `${edu.degree || 'Degree'} — ${edu.institution || 'Institution'}` : `Education #${idx + 1}`}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === education.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(edu.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer ml-1"
                    title="Remove education"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Degree / Qualification <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateItem(edu.id, { degree: e.target.value })}
                    placeholder="e.g. Bachelor of Science"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateItem(edu.id, { field: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution / University <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateItem(edu.id, { institution: e.target.value })}
                    placeholder="e.g. UC Berkeley, Stanford"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={edu.location}
                    onChange={(e) => updateItem(edu.id, { location: e.target.value })}
                    placeholder="e.g. Berkeley, CA"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Years Attended
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={edu.startYear}
                      onChange={(e) => updateItem(edu.id, { startYear: e.target.value })}
                      placeholder="Start (e.g. 2018)"
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <span className="text-slate-400 text-xs">–</span>
                    <input
                      type="text"
                      value={edu.graduationYear}
                      onChange={(e) => updateItem(edu.id, { graduationYear: e.target.value })}
                      placeholder="End (e.g. 2022)"
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GPA / Percentage (Optional)
                  </label>
                  <input
                    type="text"
                    value={edu.gpa || ''}
                    onChange={(e) => updateItem(edu.id, { gpa: e.target.value })}
                    placeholder="e.g. 3.85 / 4.0 or 88%"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relevant Coursework & Honors
                  </label>
                  <input
                    type="text"
                    value={edu.coursework || ''}
                    onChange={(e) => updateItem(edu.id, { coursework: e.target.value })}
                    placeholder="e.g. Data Structures & Algorithms, Distributed Systems, Operating Systems"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
