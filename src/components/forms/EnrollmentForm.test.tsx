import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ClassSession,
  Course,
  Enrollment,
  Student,
} from '../../types/domain'
import { EnrollmentForm } from './EnrollmentForm'

const mocks = vi.hoisted(() => ({
  apiCreate: vi.fn(),
  loadAll: vi.fn(),
  showToast: vi.fn(),
  useDataStore: vi.fn(),
}))

vi.mock('../../lib/api', () => ({
  api: {
    create: mocks.apiCreate,
  },
}))

vi.mock('../../store/useDataStore', () => ({
  useDataStore: mocks.useDataStore,
}))

vi.mock('../../store/useToastStore', () => ({
  useToastStore: (
    selector: (state: { showToast: typeof mocks.showToast }) => unknown,
  ) => selector({ showToast: mocks.showToast }),
}))

afterEach(cleanup)

const student: Student = {
  id: 'student-1',
  name: 'Nguyễn Hoàng Yến',
  email: 'yen@example.com',
  phone: '0900000001',
  joinedAt: '2026-06-01',
  status: 'active',
}

function makeCourse(id: string, name: string): Course {
  return {
    id,
    name,
    code: id.toUpperCase(),
    description: '',
    teacherId: 'teacher-1',
    roomId: 'room-1',
    startDate: '2030-06-03',
    endDate: '2030-06-28',
    schedulePattern: '2-4-6',
    startTime: '08:00',
    endTime: '10:00',
    sessionCount: 12,
    status: 'Planned',
    createdAt: '2030-05-01',
  }
}

function makeSession(id: string, courseId: string): ClassSession {
  return {
    id,
    courseId,
    teacherId: `teacher-${id}`,
    roomId: `room-${id}`,
    date: '2030-06-03',
    startTime: '08:00',
    endTime: '10:00',
  }
}

function setStoreData({
  courses,
  sessions = [],
  enrollments = [],
}: {
  courses: Course[]
  sessions?: ClassSession[]
  enrollments?: Enrollment[]
}) {
  mocks.useDataStore.mockReturnValue({
    courses,
    sessions,
    enrollments,
    loadAll: mocks.loadAll,
  })
}

function selectCourseAndSubmit(courseId: string) {
  fireEvent.change(screen.getByLabelText('Chọn khóa học'), {
    target: { value: courseId },
  })
  const form = screen
    .getByRole('button', { name: 'Xác nhận ghi danh' })
    .closest('form')

  if (!form) {
    throw new Error('Không tìm thấy form ghi danh')
  }

  fireEvent.submit(form)
}

describe('EnrollmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('báo toast và không gọi API khi khóa mới trùng lịch', () => {
    const existingCourse = makeCourse('course-existing', 'Khóa đang học')
    const targetCourse = makeCourse('course-target', 'Khóa muốn ghi danh')
    setStoreData({
      courses: [existingCourse, targetCourse],
      sessions: [
        makeSession('session-existing', existingCourse.id),
        makeSession('session-target', targetCourse.id),
      ],
      enrollments: [
        {
          id: 'enrollment-existing',
          studentId: student.id,
          courseId: existingCourse.id,
          enrolledAt: '2030-05-20',
        },
      ],
    })
    render(<EnrollmentForm student={student} onClose={vi.fn()} />)

    selectCourseAndSubmit(targetCourse.id)

    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Không thể ghi danh do trùng lịch',
        message: expect.stringContaining('Khóa đang học'),
      }),
    )
    expect(mocks.apiCreate).not.toHaveBeenCalled()
    expect(mocks.loadAll).not.toHaveBeenCalled()
  })

  it('gọi API và hoàn tất ghi danh khi lịch hợp lệ', async () => {
    const onClose = vi.fn()
    const targetCourse = makeCourse('course-target', 'Khóa muốn ghi danh')
    mocks.apiCreate.mockResolvedValue({
      id: 'enrollment-new',
      studentId: student.id,
      courseId: targetCourse.id,
      enrolledAt: '2030-06-01',
    })
    setStoreData({ courses: [targetCourse] })
    render(<EnrollmentForm student={student} onClose={onClose} />)

    selectCourseAndSubmit(targetCourse.id)

    await waitFor(() => {
      expect(mocks.apiCreate).toHaveBeenCalledOnce()
    })

    expect(mocks.apiCreate).toHaveBeenCalledWith('enrollments', {
      studentId: student.id,
      courseId: targetCourse.id,
      enrolledAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
    expect(mocks.loadAll).toHaveBeenCalledOnce()
    expect(mocks.showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Ghi danh thành công',
      message: `${student.name} đã được thêm vào khóa học.`,
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
