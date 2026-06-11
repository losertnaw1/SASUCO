import type { CourseStatus } from '../../types/domain'

const styles: Record<CourseStatus, string> = {
  Created: 'bg-slate-100 text-slate-600',
  Assigned: 'bg-amber-50 text-amber-700',
  Planned: 'bg-indigo-50 text-indigo-700',
  'In-Progress': 'bg-emerald-50 text-emerald-700',
}

const labels: Record<CourseStatus, string> = {
  Created: 'Đã tạo',
  Assigned: 'Đã gán giảng viên',
  Planned: 'Đã lên lịch',
  'In-Progress': 'Đang diễn ra',
}

export function StatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
