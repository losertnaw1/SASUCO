import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 text-xs text-slate-400 sm:flex-row">
      <span>
        Hiển thị {from}-{to} trong tổng số {total} kết quả
      </span>
      <div className="flex items-center gap-2">
        <button
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="min-w-20 text-center font-semibold text-slate-600">
          Trang {page}/{totalPages}
        </span>
        <button
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
