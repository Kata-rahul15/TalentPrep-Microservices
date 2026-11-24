import { useState } from 'react'
import type { ProjectItem } from '../../types/builder.types'
import { generateId } from '../../utils/builderUtils'
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, FolderGit2, X, Globe } from 'lucide-react'
import { GithubIcon } from './ResumeIcons'

interface Props {
  projects: ProjectItem[]
  onChange: (projects: ProjectItem[]) => void
  onImproveDescriptionWithAI: (text: string, context: string) => void
}

export default function ProjectsEditor({ projects, onChange, onImproveDescriptionWithAI }: Props) {
  const [techInputs, setTechInputs] = useState<Record<string, string>>({})

  const addProject = () => {
    const newItem: ProjectItem = {
      id: generateId('proj'),
      name: '',
      description: '',
      technologies: [],
      highlights: [''],
      repoUrl: '',
      liveUrl: '',
      startDate: '',
      endDate: '',
    }
    onChange([...projects, newItem])
  }

  const updateItem = (id: string, updates: Partial<ProjectItem>) => {
    onChange(projects.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  const removeItem = (id: string) => {
    onChange(projects.filter((p) => p.id !== id))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= projects.length) return
    const updated = [...projects]
    const temp = updated[index]
    updated[index] = updated[newIdx]
    updated[newIdx] = temp
    onChange(updated)
  }

  const addTech = (projId: string) => {
    const val = (techInputs[projId] || '').trim()
    if (!val) return
    const target = projects.find((p) => p.id === projId)
    if (!target) return
    if (!target.technologies.includes(val)) {
      updateItem(projId, { technologies: [...target.technologies, val] })
    }
    setTechInputs({ ...techInputs, [projId]: '' })
  }

  const removeTech = (projId: string, tech: string) => {
    const target = projects.find((p) => p.id === projId)
    if (!target) return
    updateItem(projId, { technologies: target.technologies.filter((t) => t !== tech) })
  }

  const addHighlight = (projId: string) => {
    const target = projects.find((p) => p.id === projId)
    if (!target) return
    updateItem(projId, { highlights: [...target.highlights, ''] })
  }

  const updateHighlight = (projId: string, hIdx: number, value: string) => {
    const target = projects.find((p) => p.id === projId)
    if (!target) return
    const updated = [...target.highlights]
    updated[hIdx] = value
    updateItem(projId, { highlights: updated })
  }

  const removeHighlight = (projId: string, hIdx: number) => {
    const target = projects.find((p) => p.id === projId)
    if (!target) return
    const updated = target.highlights.filter((_, idx) => idx !== hIdx)
    updateItem(projId, { highlights: updated.length > 0 ? updated : [''] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Projects
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Highlight technical personal, open-source, or team projects demonstrating your engineering capabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={addProject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer h-7.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2">
          <FolderGit2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No projects added yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Click &quot;Add Project&quot; to showcase your software tools, repositories, and applications.
          </p>
          <button
            type="button"
            onClick={addProject}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
          >
            <Plus className="w-3 h-3" /> Add a project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((proj, idx) => (
            <div
              key={proj.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-2xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  {proj.name || `Project #${idx + 1}`}
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
                    disabled={idx === projects.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(proj.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer ml-1"
                    title="Remove project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => updateItem(proj.id, { name: e.target.value })}
                    placeholder="e.g. SmartSearch AI Platform"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Timeframe (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={proj.startDate || ''}
                      onChange={(e) => updateItem(proj.id, { startDate: e.target.value })}
                      placeholder="Start (e.g. 2023-01)"
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <span className="text-slate-400 text-xs">–</span>
                    <input
                      type="text"
                      value={proj.endDate || ''}
                      onChange={(e) => updateItem(proj.id, { endDate: e.target.value })}
                      placeholder="End (e.g. 2023-08)"
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GitHub / Code Repository URL
                  </label>
                  <div className="relative">
                    <GithubIcon className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={proj.repoUrl || ''}
                      onChange={(e) => updateItem(proj.id, { repoUrl: e.target.value })}
                      placeholder="https://github.com/user/project"
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Live Demo / Production URL
                  </label>
                  <div className="relative">
                    <Globe className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={proj.liveUrl || ''}
                      onChange={(e) => updateItem(proj.id, { liveUrl: e.target.value })}
                      placeholder="https://project.domain.app"
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Technologies Tag Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Technologies Used
                </label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {proj.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => removeTech(proj.id, tech)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={techInputs[proj.id] || ''}
                    onChange={(e) =>
                      setTechInputs({ ...techInputs, [proj.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTech(proj.id)
                      }
                    }}
                    placeholder="Add technology (e.g. React, PostgreSQL) and press Enter"
                    className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => addTech(proj.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project Overview
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      onImproveDescriptionWithAI(proj.description, `Project overview for ${proj.name}`)
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Improve with AI
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={proj.description}
                  onChange={(e) => updateItem(proj.id, { description: e.target.value })}
                  placeholder="Short 1–2 sentence summary of the project architecture and impact."
                  className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white leading-relaxed resize-y"
                />
              </div>

              {/* Highlights / Bullet points */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Key Features & Technical Highlights
                  </label>
                  <button
                    type="button"
                    onClick={() => addHighlight(proj.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Highlight
                  </button>
                </div>

                <div className="space-y-1.5">
                  {proj.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs font-bold">•</span>
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHighlight(proj.id, hIdx, e.target.value)}
                        placeholder="e.g. Implemented sub-second vector search indexing over 100k documents."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeHighlight(proj.id, hIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Remove highlight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
