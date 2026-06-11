import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Student } from '../types/domain'
import { StudentsPage } from './StudentsPage'

const mocks = vi.hoisted(() => ({
  apiRemove: vi.fn(),
  loadAll: vi.fn(),
  showToast: vi.fn(),
  useDataStore: vi.fn(),
}))

vi.mock('../components/forms/EnrollmentForm', () => ({
  EnrollmentForm: () => null,
}))

vi.mock('../components/forms/StudentForm', () => ({
  StudentForm: () => null,
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

function makeStudent(id: string, name: string): Student {
  return {
    id,
    name,
    email: `${id}@example.com`,
    phone: `09000000${id.slice(-2)}`,
    joinedAt: '2026-06-01',
    status: 'active',
  }
}

function setStoreData(students: Student[], pageSize = 10) {
  mocks.useDataStore.mockReturnValue({
    students,
    courses: [],
    enrollments: [],
    settings: {
      id: 'app',
      pageSize,
      teacherWeeklySessionLimit: 6,
    },
    loadAll: mocks.loadAll,
  })
}

describe('StudentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tìm kiếm tiếng Việt ngay khi gõ, không phân biệt hoa thường', () => {
    setStoreData([
      makeStudent('student-1', 'Nguyễn Hoàng Yến'),
      makeStudent('student-2', 'Lê Minh Khoa'),
    ])
    render(<StudentsPage />)

    fireEvent.change(
      screen.getByPlaceholderText('Tìm theo tên, email hoặc số điện thoại...'),
      { target: { value: 'nGUYỄN HOÀNG yẾN' } },
    )

    expect(screen.getByText('Nguyễn Hoàng Yến')).toBeTruthy()
    expect(screen.queryByText('Lê Minh Khoa')).toBeNull()
    expect(screen.getByText('Hiển thị 1-1 trong tổng số 1 kết quả')).toBeTruthy()
  })

  it('phân trang danh sách học viên và đưa về trang đầu khi tìm kiếm', () => {
    setStoreData(
      [
        makeStudent('student-1', 'Học viên Một'),
        makeStudent('student-2', 'Học viên Hai'),
        makeStudent('student-3', 'Học viên Ba'),
      ],
      2,
    )
    render(<StudentsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))

    expect(screen.getByText('Học viên Ba')).toBeTruthy()
    expect(screen.queryByText('Học viên Một')).toBeNull()
    expect(screen.getByText('Trang 2/2')).toBeTruthy()

    fireEvent.change(
      screen.getByPlaceholderText('Tìm theo tên, email hoặc số điện thoại...'),
      { target: { value: 'Học viên Một' } },
    )

    expect(screen.getByText('Học viên Một')).toBeTruthy()
    expect(screen.getByText('Trang 1/1')).toBeTruthy()
  })
})
