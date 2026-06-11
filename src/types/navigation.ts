export type PageId = 'dashboard' | 'courses' | 'staff' | 'students' | 'settings'

export interface PageMeta {
  id: PageId
  label: string
  eyebrow: string
  description: string
}
