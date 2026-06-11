import { create } from 'zustand'
import type { PageId } from '../types/navigation'

interface AppState {
  activePage: PageId
  isSidebarCollapsed: boolean
  isMobileMenuOpen: boolean
  setActivePage: (page: PageId) => void
  toggleSidebar: () => void
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  setActivePage: (activePage) =>
    set({ activePage, isMobileMenuOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}))
