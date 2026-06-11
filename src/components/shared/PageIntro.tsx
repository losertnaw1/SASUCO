import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'

interface PageIntroProps {
  eyebrow: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon: LucideIcon
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
}: PageIntroProps) {
  return (
    <section className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 sm:flex-row sm:items-center lg:p-8">
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon size={23} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 sm:self-auto"
        >
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </section>
  )
}
