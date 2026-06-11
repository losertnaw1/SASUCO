import { ArrowUpRight } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  action?: string
  onAction?: () => void
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {action && (
        <button
          onClick={onAction}
          className="group flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
        >
          {action}
          <ArrowUpRight
            size={14}
            className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </button>
      )}
    </div>
  )
}
