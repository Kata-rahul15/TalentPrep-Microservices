import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TabItem {
  to: string
  label: string
  icon?: LucideIcon
  end?: boolean
  badge?: string | number
}

interface SectionTabsProps {
  items: TabItem[]
  className?: string
}

export default function SectionTabs({ items, className }: SectionTabsProps) {
  return (
    <div className={cn('border-b border-border/80', className)}>
      <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none pb-0">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 py-2 px-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all flex-shrink-0 cursor-pointer',
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.icon && (
                  <item.icon
                    className={cn(
                      'w-3.5 h-3.5 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                )}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 text-[10px] font-semibold rounded-full',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
