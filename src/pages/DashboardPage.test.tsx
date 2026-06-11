import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ClassSession,
  Course,
  Enrollment,
  Room,
  Student,
  Teacher,
} from '../types/domain'
import { DashboardPage } from './DashboardPage'

const mocks = vi.hoisted(() => ({
  setActivePage: vi.fn(),
  useDataStore: vi.fn(),
}))

vi.mock('../lib/dates', () => ({
  formatDate: (date: string) => date,
  getToday: () => '2030-06-03',
  sessionsInCurrentWeek: (sessions: ClassSession[]) => sessions,
}))

vi.mock('../store/useAppStore', () => ({
  useAppStore: (
    selector: (state: { setActivePage: typeof mocks.setActivePage }) => unknown,
  ) => selector({ setActivePage: mocks.setActivePage }),
}))

vi.mock('../store/useDataStore', () => ({
  useDataStore: mocks.useDataStore,
}))

const teachers: Teacher[] = [
  {
    id: 'teacher-exact',
    name: 'Giảng viên đạt ngưỡng',
    email: 'exact@example.com',
    phone: '0900000001',
    specialty: 'Frontend',
    status: 'active',
  },
  {
    id: 'teacher-over',
    name: 'Giảng viên vượt ngưỡng',
    email: 'over@example.com',
    phone: '0900000002',
    specialty: 'Backend',
    status: 'active',
  },
  {
    id: 'teacher-under',
    name: 'Giảng viên dưới ngưỡng',
    email: 'under@example.com',
    phone: '0900000003',
    specialty: 'Data',
    status: 'inactive',
  },
]

const courses: Course[] = [
  {
    id: 'course-planned',
    name: 'Khóa đã lên lịch',
    code: 'PLANNED',
    description: '',
    teacherId: teachers[0].id,
    roomId: 'room-active',
    startDate: '2030-06-03',
    endDate: '2030-06-30',
    schedulePattern: '2-4-6',
    startTime: '08:00',
    endTime: '10:00',
    sessionCount: 12,
    status: 'Planned',
    createdAt: '2030-05-01',
  },
  {
    id: 'course-in-progress',
    name: 'Khóa đang diễn ra',
    code: 'IN-PROGRESS',
    description: '',
    teacherId: teachers[1].id,
    roomId: 'room-active',
    startDate: '2030-05-01',
    endDate: '2030-06-30',
    schedulePattern: '3-5-7',
    startTime: '13:00',
    endTime: '15:00',
    sessionCount: 10,
    status: 'In-Progress',
    createdAt: '2030-04-01',
  },
  {
    id: 'course-created',
    name: 'Khóa mới tạo',
    code: 'CREATED',
    description: '',
    teacherId: null,
    roomId: null,
    startDate: null,
    endDate: null,
    schedulePattern: null,
    startTime: null,
    endTime: null,
    sessionCount: 8,
    status: 'Created',
    createdAt: '2030-06-01',
  },
]

const rooms: Room[] = [
  { id: 'room-active', name: 'Phòng A1', capacity: 30, status: 'active' },
  { id: 'room-inactive', name: 'Phòng B1', capacity: 20, status: 'inactive' },
]

const students: Student[] = [
  {
    id: 'student-1',
    name: 'Học viên Một',
    email: 'one@example.com',
    phone: '0910000001',
    joinedAt: '2030-05-01',
    status: 'active',
  },
  {
    id: 'student-2',
    name: 'Học viên Hai',
    email: 'two@example.com',
    phone: '0910000002',
    joinedAt: '2030-05-02',
    status: 'active',
  },
]

const enrollments: Enrollment[] = [
  {
    id: 'enrollment-1',
    studentId: students[0].id,
    courseId: courses[0].id,
    enrolledAt: '2030-05-10',
  },
  {
    id: 'enrollment-2',
    studentId: students[1].id,
    courseId: courses[0].id,
    enrolledAt: '2030-05-10',
  },
  {
    id: 'enrollment-3',
    studentId: students[1].id,
    courseId: courses[1].id,
    enrolledAt: '2030-05-11',
  },
]

function makeSession(
  id: string,
  teacherId: string,
  date = '2030-06-04',
): ClassSession {
  return {
    id,
    courseId: courses[0].id,
    teacherId,
    roomId: rooms[0].id,
    date,
    startTime: '08:00',
    endTime: '10:00',
  }
}

const sessions: ClassSession[] = [
  makeSession('session-exact-1', teachers[0].id),
  makeSession('session-exact-2', teachers[0].id),
  makeSession('session-over-1', teachers[1].id, '2030-06-03'),
  makeSession('session-over-2', teachers[1].id),
  makeSession('session-over-3', teachers[1].id),
  makeSession('session-under-1', teachers[2].id),
]

function setStoreData(teacherWeeklySessionLimit = 2) {
  mocks.useDataStore.mockReturnValue({
    courses,
    teachers,
    students,
    rooms,
    sessions,
    enrollments,
    settings: {
      id: 'app',
      teacherWeeklySessionLimit,
      pageSize: 10,
    },
  })
}

function getStat(label: string) {
  const article = screen.getByText(label).closest('article')

  if (!article) {
    throw new Error(`Không tìm thấy thống kê ${label}`)
  }

  return within(article)
}

describe('DashboardPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    setStoreData()
  })

  it('hiển thị các số liệu tổng quan lấy từ store', () => {
    render(<DashboardPage />)

    expect(getStat('Tổng học viên').getByText('2')).toBeTruthy()
    expect(getStat('Tổng học viên').getByText('3 lượt ghi danh')).toBeTruthy()
    expect(getStat('Khóa đã lên lịch').getByText('2')).toBeTruthy()
    expect(getStat('Khóa đã lên lịch').getByText('3 khóa trong hệ thống')).toBeTruthy()
    expect(getStat('Giảng viên').getByText('2')).toBeTruthy()
    expect(getStat('Giảng viên').getByText('2 người cần chú ý')).toBeTruthy()
    expect(getStat('Phòng học').getByText('1')).toBeTruthy()
    expect(getStat('Phòng học').getByText('1 buổi hôm nay')).toBeTruthy()
  })

  it('hiển thị giảng viên đạt và vượt ngưỡng động', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Ngưỡng hiện tại: ≥ 2 buổi/tuần')).toBeTruthy()
    expect(screen.getByText('Giảng viên đạt ngưỡng')).toBeTruthy()
    expect(screen.getByText('Giảng viên vượt ngưỡng')).toBeTruthy()
    expect(screen.getByText('3 buổi')).toBeTruthy()
    expect(screen.getByText('2 buổi')).toBeTruthy()
    expect(screen.queryByText('Giảng viên dưới ngưỡng')).toBeNull()
  })

  it('hiển thị trạng thái không có giảng viên quá tải', () => {
    setStoreData(4)
    render(<DashboardPage />)

    expect(screen.getByText('Ngưỡng hiện tại: ≥ 4 buổi/tuần')).toBeTruthy()
    expect(
      screen.getByText('Không có giảng viên nào đạt ngưỡng quá tải trong tuần này.'),
    ).toBeTruthy()
    expect(getStat('Giảng viên').getByText('0 người cần chú ý')).toBeTruthy()
  })
})
