import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClassSession, Course, Teacher } from '../types/domain'
import { StaffPage } from './StaffPage'

const mocks = vi.hoisted(() => ({
  apiRemove: vi.fn(),
  loadAll: vi.fn(),
  showToast: vi.fn(),
  useDataStore: vi.fn(),
}))

vi.mock('../components/forms/TeacherForm', () => ({
  TeacherForm: () => null,
}))

vi.mock('../lib/api', () => ({
  api: {
    remove: mocks.apiRemove,
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

afterEach(cleanup)

function makeTeacher(id: string, name: string): Teacher {
  return {
    id,
    name,
    email: `${id}@example.com`,
    phone: `09000000${id.slice(-2)}`,
    specialty: `Chuyên môn ${id}`,
    status: 'active',
  }
}

function makeSession(id: string, teacherId: string): ClassSession {
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  return {
    id,
    courseId: `course-${id}`,
    teacherId,
    roomId: 'room-1',
    date,
    startTime: '08:00',
    endTime: '10:00',
  }
}

function makeCourse(teacherId: string): Course {
  return {
    id: 'course-assigned',
    name: 'React nâng cao',
    code: 'REACT-01',
    description: '',
    teacherId,
    roomId: null,
    startDate: null,
    endDate: null,
    schedulePattern: null,
    startTime: null,
    endTime: null,
    sessionCount: 12,
    status: 'Assigned',
    createdAt: '2026-06-01',
  }
}

function setStoreData({
  teachers,
  courses = [],
  sessions = [],
  pageSize = 10,
  teacherWeeklySessionLimit = 6,
}: {
  teachers: Teacher[]
  courses?: Course[]
  sessions?: ClassSession[]
  pageSize?: number
  teacherWeeklySessionLimit?: number
}) {
  mocks.useDataStore.mockReturnValue({
    teachers,
    courses,
    sessions,
    settings: {
      id: 'app',
      pageSize,
      teacherWeeklySessionLimit,
    },
    loadAll: mocks.loadAll,
  })
}

describe('StaffPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tìm kiếm tiếng Việt ngay khi gõ, không phân biệt hoa thường', () => {
    setStoreData({
      teachers: [
        makeTeacher('teacher-1', 'Nguyễn Thị Ánh'),
        makeTeacher('teacher-2', 'Trần Quốc Bình'),
      ],
    })
    render(<StaffPage />)

    fireEvent.change(
      screen.getByPlaceholderText(
        'Tìm tên, email, số điện thoại, chuyên môn...',
      ),
      { target: { value: 'nGUYỄN THỊ áNH' } },
    )

    expect(screen.getByText('Nguyễn Thị Ánh')).toBeTruthy()
    expect(screen.queryByText('Trần Quốc Bình')).toBeNull()
    expect(screen.getByText('Hiển thị 1-1 trong tổng số 1 kết quả')).toBeTruthy()
  })

  it('phân trang danh sách giảng viên', () => {
    setStoreData({
      teachers: [
        makeTeacher('teacher-1', 'Giảng viên Một'),
        makeTeacher('teacher-2', 'Giảng viên Hai'),
        makeTeacher('teacher-3', 'Giảng viên Ba'),
      ],
      pageSize: 2,
    })
    render(<StaffPage />)

    expect(screen.getByText('Giảng viên Một')).toBeTruthy()
    expect(screen.queryByText('Giảng viên Ba')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))

    expect(screen.getByText('Giảng viên Ba')).toBeTruthy()
    expect(screen.queryByText('Giảng viên Một')).toBeNull()
    expect(screen.getByText('Trang 2/2')).toBeTruthy()
  })

  it('hiển thị cảnh báo khi số buổi dạy đạt threshold', () => {
    const overloaded = makeTeacher('teacher-1', 'Giảng viên Quá Tải')
    const available = makeTeacher('teacher-2', 'Giảng viên Bình Thường')
    setStoreData({
      teachers: [overloaded, available],
      sessions: [
        makeSession('session-1', overloaded.id),
        makeSession('session-2', overloaded.id),
        makeSession('session-3', available.id),
      ],
      teacherWeeklySessionLimit: 2,
    })
    render(<StaffPage />)

    const overloadedCard = screen.getByText(overloaded.name).closest('article')
    const availableCard = screen.getByText(available.name).closest('article')

    expect(overloadedCard).not.toBeNull()
    expect(availableCard).not.toBeNull()
    expect(within(overloadedCard!).getByText('2 buổi')).toBeTruthy()
    expect(overloadedCard!.querySelector('svg.text-rose-500')).not.toBeNull()
    expect(availableCard!.querySelector('svg.text-rose-500')).toBeNull()
  })

  it('chặn xóa giảng viên còn khóa phụ trách và không gọi API', () => {
    const teacher = makeTeacher('teacher-1', 'Nguyễn Minh Anh')
    setStoreData({
      teachers: [teacher],
      courses: [makeCourse(teacher.id)],
    })
    render(<StaffPage />)

    const card = screen.getByText(teacher.name).closest('article')
    expect(card).not.toBeNull()
    fireEvent.click(within(card!).getAllByRole('button').at(-1)!)

    expect(mocks.showToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'Không thể xóa giảng viên',
      message:
        'Giảng viên đang phụ trách khóa “React nâng cao”. Hãy đổi phân công trước.',
    })
    expect(mocks.apiRemove).not.toHaveBeenCalled()
    expect(mocks.loadAll).not.toHaveBeenCalled()
  })
})
