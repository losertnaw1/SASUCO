import { Database, LoaderCircle, RefreshCw } from 'lucide-react'

interface ServerStateProps {
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function ServerState({ loading, error, onRetry }: ServerStateProps) {
  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center">
        <div className="text-center text-slate-400">
          <LoaderCircle className="mx-auto animate-spin" size={28} />
          <p className="mt-3 text-xs font-semibold">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (!error) return null

  return (
    <div className="grid min-h-[420px] place-items-center rounded-3xl border border-dashed border-rose-200 bg-rose-50/50 p-8 text-center">
      <div>
        <Database className="mx-auto text-rose-400" size={30} />
        <h2 className="mt-4 text-sm font-bold text-slate-800">
          Không thể kết nối JSON Server
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
          {error} Hãy chạy lệnh <strong>npm run server</strong> rồi thử lại.
        </p>
        <button
          onClick={onRetry}
          className="mx-auto mt-4 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white"
        >
          <RefreshCw size={14} /> Thử kết nối lại
        </button>
      </div>
    </div>
  )
}
