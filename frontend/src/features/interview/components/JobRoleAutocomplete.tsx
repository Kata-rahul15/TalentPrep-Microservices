import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from 'react'
import { Briefcase, ChevronDown, Check, Plus, X } from 'lucide-react'

const INITIAL_JOB_ROLES: string[] = [
  'Java Developer',
  'Java Backend Developer',
  'Spring Boot Developer',
  'Backend Engineer',
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'React Developer',
  'Python Developer',
  'Data Engineer',
  'DevOps Engineer',
  'AI Engineer',
  'Machine Learning Engineer',
]

interface JobRoleAutocompleteProps {
  value: string
  onChange: (role: string) => void
  additionalSuggestions?: string[]
  placeholder?: string
  maxSuggestions?: number
}

export default function JobRoleAutocomplete({
  value,
  onChange,
  additionalSuggestions = [],
  placeholder = 'Search or type a target job role (e.g., Java Backend Developer)',
  maxSuggestions = 8,
}: JobRoleAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const allRoles = useMemo(() => {
    const seen = new Set<string>()
    const merged: string[] = []
    for (const candidate of [...INITIAL_JOB_ROLES, ...additionalSuggestions]) {
      const trimmed = candidate?.trim()
      if (!trimmed) continue
      const key = trimmed.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(trimmed)
      }
    }
    return merged
  }, [additionalSuggestions])

  const filteredRoles = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) {
      return allRoles.slice(0, maxSuggestions)
    }
    const startsWith = allRoles.filter((role) => role.toLowerCase().startsWith(query))
    const contains = allRoles.filter(
      (role) => !role.toLowerCase().startsWith(query) && role.toLowerCase().includes(query)
    )
    return [...startsWith, ...contains].slice(0, maxSuggestions)
  }, [allRoles, value, maxSuggestions])

  const hasExactMatch = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return true
    return allRoles.some((role) => role.toLowerCase() === query)
  }, [allRoles, value])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const selectRole = (role: string) => {
    onChange(role.trim())
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      return
    }

    if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (!isOpen) return

    const totalItems = filteredRoles.length + (!hasExactMatch && value.trim() ? 1 : 0)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredRoles.length) {
        selectRole(filteredRoles[highlightedIndex])
      } else if (value.trim()) {
        selectRole(value)
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="job-role-listbox"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFAFA] dark:bg-slate-800/60 text-sm text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-[#2563EB]"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              aria-label="Clear target role"
              onClick={() => {
                onChange('')
                setIsOpen(true)
                inputRef.current?.focus()
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label="Toggle role suggestions"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          id="job-role-listbox"
          role="listbox"
          className="absolute z-30 mt-1.5 w-full bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-100/70 dark:divide-slate-800/70">
            {filteredRoles.map((role, index) => {
              const isSelected = role.toLowerCase() === value.trim().toLowerCase()
              const isHighlighted = index === highlightedIndex
              return (
                <button
                  key={role}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectRole(role)}
                  className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    isHighlighted || isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-300 font-semibold'
                      : 'text-[#111827] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{role}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#2563EB] flex-shrink-0" />}
                </button>
              )
            })}

            {!hasExactMatch && value.trim() && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => selectRole(value)}
                className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                  highlightedIndex === filteredRoles.length
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] font-semibold'
                    : 'text-[#2563EB] dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Use custom role: &ldquo;{value.trim()}&rdquo;</span>
              </button>
            )}

            {filteredRoles.length === 0 && !value.trim() && (
              <div className="px-3.5 py-2.5 text-xs text-slate-400">
                Type to search or enter a custom role.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

