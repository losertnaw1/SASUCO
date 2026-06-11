import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  size?: 'md' | 'lg' | 'xl'
}

const sizes = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = 'lg',
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <button
        aria-label="Đóng hộp thoại"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <section
        className={`relative my-6 w-full ${sizes[size]} rounded-3xl bg-white shadow-2xl shadow-slate-950/25`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </header>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">
          {children}
        </div>
      </section>
    </div>
  )
}
