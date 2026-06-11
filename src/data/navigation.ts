import type { PageMeta } from '../types/navigation'

export const pages: PageMeta[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    eyebrow: 'Tổng quan',
    description: 'Theo dõi nhanh hiệu quả vận hành trung tâm.',
  },
  {
    id: 'courses',
    label: 'Quản lý khóa học',
    eyebrow: 'Đào tạo',
    description: 'Quản lý chương trình, lịch học và tiến độ đào tạo.',
  },
  {
    id: 'staff',
    label: 'Quản lý nhân sự',
    eyebrow: 'Nhân sự',
    description: 'Quản lý giảng viên và đội ngũ vận hành trung tâm.',
  },
  {
    id: 'students',
    label: 'Quản lý học viên',
    eyebrow: 'Học viên',
    description: 'Theo dõi hồ sơ, kết quả và hành trình học tập.',
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    eyebrow: 'Hệ thống',
    description: 'Điều chỉnh các quy tắc vận hành của trung tâm.',
  },
]
