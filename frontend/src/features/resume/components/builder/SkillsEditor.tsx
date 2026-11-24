import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import type { SkillCategory } from '../../types/builder.types'
import { generateId } from '../../utils/builderUtils'
import { PREDEFINED_SKILL_CATEGORIES } from '../../utils/skillTaxonomy'
import { GripVertical, Plus, X, Trash2, Wrench, Sparkles } from 'lucide-react'

interface Props {
  skills: SkillCategory[]
  onChange: (skills: SkillCategory[]) => void
}

interface DragPayload {
  skill: string
  sourceCategoryId: string
}

const PREDEFINED_NAMES = new Set<string>(
  PREDEFINED_SKILL_CATEGORIES.map((category) => category.name)
)

export default function SkillsEditor({ skills, onChange }: Props) {
  const [newSkillInput, setNewSkillInput] = useState<Record<string, string>>({})
  const [draggedSkill, setDraggedSkill] = useState<DragPayload | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)

  const orderedSkills = useMemo(() => {
    const predefined = PREDEFINED_SKILL_CATEGORIES.map((definition) => {
      return skills.find((category) => category.categoryName === definition.name) || {
        id: `cat-${definition.key}`,
        categoryName: definition.name,
        skills: [],
      }
    })

    const custom = skills.filter(
      (category) => !PREDEFINED_NAMES.has(category.categoryName)
    )

    return [...predefined, ...custom]
  }, [skills])

  const updateCategories = (next: SkillCategory[]) => {
    onChange(next)
  }

  const addCategory = () => {
    updateCategories([
      ...orderedSkills,
      {
        id: generateId('cat'),
        categoryName: 'Custom Category',
        skills: [],
      },
    ])
  }

  const updateCategoryName = (catId: string, name: string) => {
    updateCategories(
      orderedSkills.map((category) =>
        category.id === catId
          ? { ...category, categoryName: name }
          : category
      )
    )
  }

  const removeCategory = (catId: string) => {
    const target = orderedSkills.find((category) => category.id === catId)
    if (!target || PREDEFINED_NAMES.has(target.categoryName)) return

    const other = orderedSkills.find(
      (category) => category.categoryName === 'Other'
    )

    const withoutCategory = orderedSkills.filter(
      (category) => category.id !== catId
    )

    if (other && target.skills.length > 0) {
      updateCategories(
        withoutCategory.map((category) =>
          category.id === other.id
            ? {
                ...category,
                skills: Array.from(
                  new Set([...category.skills, ...target.skills])
                ),
              }
            : category
        )
      )
    } else {
      updateCategories(withoutCategory)
    }
  }

  const addSkillToCategory = (catId: string) => {
    const value = (newSkillInput[catId] || '').trim()
    if (!value) return

    updateCategories(
      orderedSkills.map((category) => {
        if (category.id !== catId) return category

        const exists = category.skills.some(
          (skill) => skill.trim().toLowerCase() === value.toLowerCase()
        )

        return exists
          ? category
          : { ...category, skills: [...category.skills, value] }
      })
    )

    setNewSkillInput((current) => ({
      ...current,
      [catId]: '',
    }))
  }

  const removeSkillFromCategory = (
    catId: string,
    skillToRemove: string
  ) => {
    updateCategories(
      orderedSkills.map((category) =>
        category.id === catId
          ? {
              ...category,
              skills: category.skills.filter(
                (skill) => skill !== skillToRemove
              ),
            }
          : category
      )
    )
  }

  const moveSkill = (
    skill: string,
    sourceCategoryId: string,
    targetCategoryId: string
  ) => {
    if (sourceCategoryId === targetCategoryId) return

    const source = orderedSkills.find(
      (category) => category.id === sourceCategoryId
    )
    const target = orderedSkills.find(
      (category) => category.id === targetCategoryId
    )

    if (!source || !target) return

    const alreadyExists = target.skills.some(
      (existing) => existing.trim().toLowerCase() === skill.trim().toLowerCase()
    )

    const next = orderedSkills.map((category) => {
      if (category.id === sourceCategoryId) {
        return {
          ...category,
          skills: category.skills.filter((item) => item !== skill),
        }
      }

      if (category.id === targetCategoryId && !alreadyExists) {
        return {
          ...category,
          skills: [...category.skills, skill],
        }
      }

      return category
    })

    updateCategories(next)
  }

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    skill: string,
    sourceCategoryId: string
  ) => {
    const payload = {
      skill,
      sourceCategoryId,
    }

    setDraggedSkill(payload)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      'application/x-talentprep-skill',
      JSON.stringify(payload)
    )
    event.dataTransfer.setData('text/plain', skill)
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    targetCategoryId: string
  ) => {
    event.preventDefault()
    setDragOverCategory(null)

    let payload = draggedSkill

    try {
      const raw = event.dataTransfer.getData(
        'application/x-talentprep-skill'
      )
      if (raw) payload = JSON.parse(raw) as DragPayload
    } catch {
      // Keep React state payload as fallback.
    }

    if (!payload?.skill || !payload.sourceCategoryId) return

    moveSkill(
      payload.skill,
      payload.sourceCategoryId,
      targetCategoryId
    )

    setDraggedSkill(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-sm text-foreground">
              Technical Skills
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#080908] text-[#CDF22B] px-2 py-0.5 text-[10px] font-mono font-bold">
              <Sparkles className="w-3 h-3" />
              Smart categories
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            TalentPrep automatically groups parsed skills into professional categories. Drag any skill to another category, remove it, or add new skills yourself.
          </p>
        </div>

        <button
          type="button"
          onClick={addCategory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-card border border-border hover:border-[#080908] rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Custom category
        </button>
      </div>

      {orderedSkills.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-2">
          <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-semibold text-foreground">
            No skill categories available
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {orderedSkills.map((category) => {
            const isPredefined = PREDEFINED_NAMES.has(category.categoryName)
            const isDropTarget = dragOverCategory === category.id

            return (
              <div
                key={category.id}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDragOverCategory(category.id)
                }}
                onDragLeave={() => setDragOverCategory(null)}
                onDrop={(event) => handleDrop(event, category.id)}
                className={`group rounded-xl border bg-card p-3.5 transition-all ${
                  isDropTarget
                    ? 'border-[#080908] ring-2 ring-[#080908]/20 shadow-md'
                    : 'border-border shadow-2xs hover:border-[#080908]/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-secondary-bg border border-border flex items-center justify-center text-foreground">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>

                  <input
                    type="text"
                    value={category.categoryName}
                    readOnly={isPredefined}
                    onChange={(event) =>
                      updateCategoryName(category.id, event.target.value)
                    }
                    className={`flex-1 min-w-0 font-heading font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-dashed py-1 focus:outline-none focus:border-blue-500 ${
                      isPredefined
                        ? 'border-transparent cursor-default'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />

                  {isPredefined ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#383B36] dark:text-[#BDB9AF]">
                      Recommended
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      className="p-1 text-[#484B46] dark:text-[#BDB9AF] hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Remove category (skills move to Other)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div
                  className={`min-h-[58px] rounded-lg border border-dashed p-2 transition-colors ${
                    isDropTarget
                      ? 'border-[#080908] dark:border-[#CDF22B] bg-[#CDF22B]/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30'
                  }`}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {category.skills.map((skill) => (
                      <div
                        key={skill}
                        draggable
                        onDragStart={(event) =>
                          handleDragStart(event, skill, category.id)
                        }
                        onDragEnd={() => {
                          setDraggedSkill(null)
                          setDragOverCategory(null)
                        }}
                        title="Drag to another category"
                        className="group/skill inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-grab active:cursor-grabbing hover:border-[#080908] dark:hover:border-[#CDF22B] hover:text-[#080908] dark:hover:text-[#FAF8F3] transition-colors select-none"
                      >
                        <GripVertical className="w-3 h-3 text-[#484B46] dark:text-[#BDB9AF]" />
                        <span>{skill}</span>
                        <button
                          type="button"
                          draggable={false}
                          onClick={(event) => {
                            event.stopPropagation()
                            removeSkillFromCategory(category.id, skill)
                          }}
                          className="text-[#484B46] dark:text-[#BDB9AF] hover:text-rose-500 cursor-pointer"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {category.skills.length === 0 && (
                    <div className="h-10 flex items-center justify-center text-[10px] text-[#383B36] dark:text-[#BDB9AF]">
                      {isDropTarget ? 'Release to move skill here' : 'Drop skills here'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2.5">
                  <input
                    type="text"
                    value={newSkillInput[category.id] || ''}
                    onChange={(event) =>
                      setNewSkillInput((current) => ({
                        ...current,
                        [category.id]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addSkillToCategory(category.id)
                      }
                    }}
                    placeholder="Add a skill..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-[11px] bg-card border border-border rounded-lg focus:outline-none focus:border-[#080908] text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => addSkillToCategory(category.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#080908] bg-[#CDF22B] hover:bg-[#bce022] rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-lg border border-[#E5E0D5] bg-[#FAF8F3] dark:bg-card px-3 py-2.5 text-[10px] text-foreground leading-relaxed">
        <strong>Tip:</strong> Drag skills between categories to tailor the resume for a specific role. Skills that TalentPrep cannot confidently classify are placed in <strong>Other</strong> so nothing gets lost.
      </div>
    </div>
  )
}
