import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToastStore, type ToastType } from '../../store/useToastStore'

const styles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex gap-3 rounded-2xl border p-4 shadow-xl shadow-slate-900/10 ${styles[toast.type]}`}
          >
            <Icon size={20} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-xs leading-5 opacity-80">{toast.message}</p>
              )}
            </div>
            <button
              aria-label="Đóng thông báo"
              onClick={() => removeToast(toast.id)}
              className="self-start rounded-lg p-1 opacity-60 transition hover:bg-white/60 hover:opacity-100"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
