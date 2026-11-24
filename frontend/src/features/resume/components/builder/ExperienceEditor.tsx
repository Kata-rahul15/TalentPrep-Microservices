import type { WorkExperienceItem } from '../../types/builder.types'
import { generateId } from '../../utils/builderUtils'
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Building2, MapPin, Calendar } from 'lucide-react'

interface Props {
  experience: WorkExperienceItem[]
  onChange: (experience: WorkExperienceItem[]) => void
  onImproveBulletWithAI: (bulletText: string, context: string) => void
}

export default function ExperienceEditor({ experience, onChange, onImproveBulletWithAI }: Props) {
  const addExperience = () => {
    const newItem: WorkExperienceItem = {
      id: generateId('exp'),
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      highlights: [''],
    }
    onChange([...experience, newItem])
  }

  const updateItem = (id: string, updates: Partial<WorkExperienceItem>) => {
    onChange(experience.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)))
  }

  const removeItem = (id: string) => {
    onChange(experience.filter((exp) => exp.id !== id))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= experience.length) return
    const updated = [...experience]
    const temp = updated[index]
    updated[index] = updated[newIdx]
    updated[newIdx] = temp
    onChange(updated)
  }

  const addHighlight = (expId: string) => {
    const target = experience.find((e) => e.id === expId)
    if (!target) return
    updateItem(expId, { highlights: [...target.highlights, ''] })
  }

  const updateHighlight = (expId: string, hIdx: number, value: string) => {
    const target = experience.find((e) => e.id === expId)
    if (!target) return
    const updated = [...target.highlights]
    updated[hIdx] = value
    updateItem(expId, { highlights: updated })
  }

  const removeHighlight = (expId: string, hIdx: number) => {
    const target = experience.find((e) => e.id === expId)
    if (!target) return
    const updated = target.highlights.filter((_, idx) => idx !== hIdx)
    updateItem(expId, { highlights: updated.length > 0 ? updated : [''] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Work Experience
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add your professional career history, highlighting key responsibilities and measurable outcomes.
          </p>
        </div>

        <button
          type="button"
          onClick={addExperience}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer h-7.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Position</span>
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No work experience added yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Click &quot;Add Position&quot; to include your job roles, companies, dates, and achievements.
          </p>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
          >
            <Plus className="w-3 h-3" /> Add your first job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, idx) => (
            <div
              key={exp.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-2xs"
            >
              {/* Card Header & Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  {exp.role || exp.company ? `${exp.role || 'Role'} at ${exp.company || 'Company'}` : `Position #${idx + 1}`}
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
                    disabled={idx === experience.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(exp.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer ml-1"
                    title="Remove position"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title / Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => updateItem(exp.id, { role: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Organization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateItem(exp.id, { company: e.target.value })}
                    placeholder="e.g. Google, TechFlow Systems"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateItem(exp.id, { location: e.target.value })}
                      placeholder="e.g. San Francisco, CA (or Remote)"
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Dates & Currently Working */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time Period
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Calendar className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateItem(exp.id, { startDate: e.target.value })}
                        placeholder="Start (e.g. 2021-03)"
                        className="w-full pl-6 pr-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">–</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        disabled={exp.isCurrent}
                        value={exp.isCurrent ? 'Present' : exp.endDate}
                        onChange={(e) => updateItem(exp.id, { endDate: e.target.value })}
                        placeholder="End (e.g. 2023-11)"
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
                      />
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.isCurrent}
                      onChange={(e) => updateItem(exp.id, { isCurrent: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 text-xs"
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      I currently work here
                    </span>
                  </label>
                </div>
              </div>

              {/* Bullet Points / Achievements */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Key Accomplishments & Bullet Points
                  </label>
                  <button
                    type="button"
                    onClick={() => addHighlight(exp.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Bullet Point
                  </button>
                </div>

                <div className="space-y-2">
                  {exp.highlights.map((bullet, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-1.5">
                      <span className="text-slate-400 text-xs mt-1.5 font-bold">•</span>
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => updateHighlight(exp.id, hIdx, e.target.value)}
                        placeholder="e.g. Spearheaded migration of legacy services to Kubernetes, reducing downtime by 35%."
                        className="flex-1 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white leading-relaxed resize-y"
                      />
                      <div className="flex flex-col gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            onImproveBulletWithAI(
                              bullet,
                              `Work experience bullet for ${exp.role || 'Position'} at ${exp.company || 'Company'}`
                            )
                          }
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                          title="Improve this bullet with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHighlight(exp.id, hIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove bullet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
