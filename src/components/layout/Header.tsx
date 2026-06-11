import { Bell, ChevronDown, Menu } from 'lucide-react'
import { pages } from '../../data/navigation'
import { useAppStore } from '../../store/useAppStore'
import { Avatar } from '../ui/Avatar'

export function Header() {
  const { activePage, toggleMobileMenu } = useAppStore()
  const currentPage = pages.find((page) => page.id === activePage) ?? pages[0]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f7f8fc]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center gap-4">
        <button
          aria-label="Mở menu"
          onClick={toggleMobileMenu}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
            {currentPage.eyebrow}
          </p>
          <h1 className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {currentPage.label}
          </h1>
        </div>

        <button
          aria-label="Thông báo"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-indigo-600"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        </button>

        <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 shadow-sm transition hover:border-indigo-200 sm:flex">
          <Avatar initials="NA" size="sm" />
          <span className="hidden text-left xl:block">
            <span className="block text-[11px] font-bold text-slate-800">
              Minh Anh
            </span>
            <span className="block text-[9px] text-slate-400">Quản trị viên</span>
          </span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  )
}
