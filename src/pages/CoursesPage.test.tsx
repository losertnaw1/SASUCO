import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Course, Teacher } from '../types/domain'
import { CoursesPage } from './CoursesPage'

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  useDataStore: vi.fn(),
}))

vi.mock('../components/forms/CourseForm', () => ({
  CourseForm: () => null,
}))

vi.mock('../lib/api', () => ({
  api: {
    remove: vi.fn(),
  },
}))

vi.mock('../store/useDataStore', () => ({
  useDataStore: mocks.useDataStore,
}))

vi.mock('../store/useToastStore', () => ({
  useToastStore: (
    selector: (state: { showToast: typeof mocks.showToast }) => unknown,
  ) => selector({ showToast: mocks.showToast }),
}))

const teachers: Teacher[] = [
  {
    id: 'teacher-1',
    name: 'Nguyễn Minh Anh',
    email: 'minh.anh@example.com',
    phone: '0900000001',
    specialty: 'Frontend',
    status: 'active',
  },
  {
    id: 'teacher-2',
    name: 'Trần Quốc Bình',
    email: 'quoc.binh@example.com',
    phone: '0900000002',
    specialty: 'Backend',
    status: 'active',
  },
]

const courses: Course[] = [
  {
    id: 'course-created',
    name: 'Lập trình tiếng Việt',
    code: 'TV-01',
    description: '',
    teacherId: teachers[0].id,
    roomId: null,
    startDate: null,
    endDate: null,
    schedulePattern: null,
    startTime: null,
    endTime: null,
    sessionCount: 12,
    status: 'Created',
    createdAt: '2026-06-01',
  },
  {
    id: 'course-planned',
    name: 'React nâng cao',
    code: 'REACT-02',
    description: '',
    teacherId: teachers[1].id,
    roomId: 'room-1',
    startDate: '2030-06-03',
    endDate: '2030-06-28',
    schedulePattern: '2-4-6',
    startTime: '08:00',
    endTime: '10:00',
    sessionCount: 12,
    status: 'Planned',
    createdAt: '2026-06-01',
  },
]

describe('CoursesPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useDataStore.mockReturnValue({
      courses,
      teachers,
      rooms: [
        {
          id: 'room-1',
          name: 'Phòng A1',
          capacity: 30,
          status: 'active',
        },
      ],
      sessions: [],
      enrollments: [],
      students: [],
      settings: {
        id: 'app',
        teacherWeeklySessionLimit: 6,
        pageSize: 10,
      },
      loadAll: vi.fn(),
    })
  })

  it('tìm kiếm tiếng Việt không phân biệt hoa thường', () => {
    render(<CoursesPage />)

    fireEvent.change(
      screen.getByPlaceholderText('Tìm theo tên, mã hoặc giảng viên...'),
      {
        target: { value: 'lẬP TRÌNH TIẾNG việt' },
      },
    )

    expect(screen.getByText('Lập trình tiếng Việt')).toBeTruthy()
    expect(screen.queryByText('React nâng cao')).toBeNull()
  })

  it('lọc khóa học theo trạng thái', () => {
    render(<CoursesPage />)

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Planned' },
    })

    expect(screen.getByText('React nâng cao')).toBeTruthy()
    expect(screen.queryByText('Lập trình tiếng Việt')).toBeNull()
    expect(screen.getByText('Hiển thị 1-1 trong tổng số 1 kết quả')).toBeTruthy()
  })
})
