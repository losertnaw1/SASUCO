import {
  BookOpenText,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  UsersRound,
  UserSquare2,
  X,
} from 'lucide-react'
import { pages } from '../../data/navigation'
import { useAppStore } from '../../store/useAppStore'
import type { PageId } from '../../types/navigation'
import { Avatar } from '../ui/Avatar'

const icons = {
  dashboard: LayoutDashboard,
  courses: BookOpenText,
  staff: UserSquare2,
  students: UsersRound,
  settings: Settings,
} satisfies Record<PageId, typeof LayoutDashboard>

export function Sidebar() {
  const {
    activePage,
    isSidebarCollapsed,
    isMobileMenuOpen,
    setActivePage,
    toggleSidebar,
    closeMobileMenu,
  } = useAppStore()

  return (
    <>
      <button
        aria-label="Đóng menu"
        onClick={closeMobileMenu}
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition lg:hidden ${
          isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white px-3 py-4 shadow-xl shadow-slate-900/5 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          isSidebarCollapsed ? 'lg:w-[88px]' : 'lg:w-[264px]'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px]`}
      >
        <div
          className={`mb-8 flex h-11 items-center ${
            isSidebarCollapsed ? 'lg:justify-center' : 'justify-between px-2'
          }`}
        >
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-3 overflow-hidden text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={22} strokeWidth={2.4} />
            </span>
            <span
              className={`whitespace-nowrap transition ${
                isSidebarCollapsed ? 'lg:hidden' : ''
              }`}
            >
              <span className="block text-base font-black leading-none tracking-tight text-slate-900">
                SASUCO
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Training center
              </span>
            </span>
          </button>
          <button
            aria-label="Đóng menu"
            onClick={closeMobileMenu}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {!isSidebarCollapsed && (
            <p className="mb-3 hidden px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 lg:block">
              Không gian làm việc
            </p>
          )}
          {pages.filter((page) => page.id !== 'settings').map((page) => {
            const Icon = icons[page.id]
            const isActive = page.id === activePage

            return (
              <button
                key={page.id}
                title={isSidebarCollapsed ? page.label : undefined}
                onClick={() => setActivePage(page.id)}
                className={`group flex w-full items-center rounded-xl py-3 text-sm font-semibold transition ${
                  isSidebarCollapsed
                    ? 'lg:justify-center lg:px-0'
                    : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/80'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span
                  className={`whitespace-nowrap ${
                    isSidebarCollapsed ? 'lg:hidden' : ''
                  }`}
                >
                  {page.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActivePage('settings')}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 ${
              isSidebarCollapsed ? 'lg:justify-center' : 'gap-3 px-3'
            } ${activePage === 'settings' ? 'bg-indigo-50 text-indigo-700' : ''}`}
          >
            <Settings size={18} className="shrink-0" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Cài đặt</span>
          </button>
          <div
            className={`mt-2 flex items-center rounded-2xl bg-slate-50 p-2 ${
              isSidebarCollapsed ? 'lg:justify-center' : 'gap-3'
            }`}
          >
            <Avatar initials="NA" size="sm" />
            <div
              className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
            >
              <p className="truncate text-xs font-bold text-slate-800">
                Nguyễn Minh Anh
              </p>
              <p className="truncate text-[10px] text-slate-400">Quản trị viên</p>
            </div>
            <button
              aria-label="Đăng xuất"
              className={`rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-500 ${
                isSidebarCollapsed ? 'lg:hidden' : ''
              }`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <button
          aria-label="Thu gọn sidebar"
          onClick={toggleSidebar}
          className={`absolute -right-3 top-20 hidden h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-indigo-600 lg:grid ${
            isSidebarCollapsed ? 'rotate-180' : ''
          }`}
        >
          <ChevronLeft size={15} />
        </button>
      </aside>
    </>
  )
}
