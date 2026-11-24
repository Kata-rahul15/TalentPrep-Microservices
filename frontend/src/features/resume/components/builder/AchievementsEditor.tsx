import type { AchievementItem } from '../../types/builder.types'
import { generateId } from '../../utils/builderUtils'
import { Plus, Trash2, Trophy } from 'lucide-react'

interface Props {
  achievements: AchievementItem[]
  onChange: (achievements: AchievementItem[]) => void
}

export default function AchievementsEditor({ achievements, onChange }: Props) {
  const addAchievement = () => {
    const newItem: AchievementItem = {
      id: generateId('ach'),
      title: '',
      description: '',
    }
    onChange([...achievements, newItem])
  }

  const updateItem = (id: string, updates: Partial<AchievementItem>) => {
    onChange(achievements.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }

  const removeItem = (id: string) => {
    onChange(achievements.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Honors & Achievements
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            List hackathon victories, academic honors, peer recognition, and major career milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={addAchievement}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer h-7.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Achievement</span>
        </button>
      </div>

      {achievements.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No achievements added yet
          </p>
          <button
            type="button"
            onClick={addAchievement}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
          >
            <Plus className="w-3 h-3" /> Add achievement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  {ach.title || 'New Achievement'}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(ach.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Achievement Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={ach.title}
                  onChange={(e) => updateItem(ach.id, { title: e.target.value })}
                  placeholder="e.g. 1st Place — National Cloud Hackathon"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Context (Optional)
                </label>
                <input
                  type="text"
                  value={ach.description}
                  onChange={(e) => updateItem(ach.id, { description: e.target.value })}
                  placeholder="e.g. Built automated cost analysis bot selected from 120+ participating teams."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
