import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClassSession, Course, Room, Teacher } from '../../types/domain'
import { CourseForm } from './CourseForm'

const mocks = vi.hoisted(() => ({
  apiCreate: vi.fn(),
  apiRemove: vi.fn(),
  apiUpdate: vi.fn(),
  loadAll: vi.fn(),
  showToast: vi.fn(),
  useDataStore: vi.fn(),
}))

vi.mock('../../lib/api', () => ({
  api: {
    create: mocks.apiCreate,
    remove: mocks.apiRemove,
    update: mocks.apiUpdate,
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

const teacher: Teacher = {
  id: 'teacher-1',
  name: 'Nguyễn Minh Anh',
  email: 'minh.anh@example.com',
  phone: '0900000001',
  specialty: 'React',
  status: 'active',
}

const room: Room = {
  id: 'room-1',
  name: 'Phòng A1',
  capacity: 30,
  status: 'active',
}

const existingCourse: Course = {
  id: 'course-existing',
  name: 'Khóa đang diễn ra',
  code: 'OLD-01',
  description: '',
  teacherId: teacher.id,
  roomId: room.id,
  startDate: '2030-06-03',
  endDate: '2030-06-03',
  schedulePattern: '2-4-6',
  startTime: '08:00',
  endTime: '10:00',
  sessionCount: 1,
  status: 'Planned',
  createdAt: '2030-05-01',
}

const existingSession: ClassSession = {
  id: 'session-existing',
  courseId: existingCourse.id,
  teacherId: teacher.id,
  roomId: room.id,
  date: '2030-06-03',
  startTime: '08:00',
  endTime: '10:00',
}

function setStoreData({
  courses = [],
  sessions = [],
}: {
  courses?: Course[]
  sessions?: ClassSession[]
} = {}) {
  mocks.useDataStore.mockReturnValue({
    teachers: [teacher],
    rooms: [room],
    courses,
    sessions,
    enrollments: [],
    students: [],
    loadAll: mocks.loadAll,
  })
}

function submitForm() {
  const form = screen.getByRole('button', { name: 'Lưu khóa học' }).closest('form')

  if (!form) {
    throw new Error('Không tìm thấy form khóa học')
  }

  fireEvent.submit(form)
}

function fillRequiredCourseFields() {
  fireEvent.change(screen.getByLabelText(/Tên khóa học/), {
    target: { value: 'React nâng cao' },
  })
  fireEvent.change(screen.getByLabelText(/Mã khóa học/), {
    target: { value: 'react-01' },
  })
}

function fillScheduleFields() {
  fireEvent.change(screen.getByLabelText('Giảng viên phụ trách'), {
    target: { value: teacher.id },
  })
  fireEvent.change(screen.getByLabelText('Phòng học'), {
    target: { value: room.id },
  })
  fireEvent.change(screen.getByLabelText('Ngày khai giảng'), {
    target: { value: '2030-06-03' },
  })
}

describe('CourseForm', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    setStoreData()
  })

  it('báo lỗi khi tạo khóa học thiếu tên và mã', () => {
    render(<CourseForm open onClose={vi.fn()} />)

    submitForm()

    expect(mocks.showToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'Thiếu thông tin khóa học',
      message: 'Tên khóa học và mã khóa học là bắt buộc.',
    })
    expect(mocks.apiCreate).not.toHaveBeenCalled()
    expect(mocks.apiUpdate).not.toHaveBeenCalled()
  })

  it('báo toast lỗi và không gọi API khi lịch bị trùng', () => {
    setStoreData({
      courses: [existingCourse],
      sessions: [existingSession],
    })
    render(<CourseForm open onClose={vi.fn()} />)

    fillRequiredCourseFields()
    fillScheduleFields()
    fireEvent.change(screen.getByLabelText('Số buổi'), {
      target: { value: '1' },
    })
    submitForm()

    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Không thể lên lịch do tranh chấp',
        message: expect.stringContaining('Giảng viên đã có lịch dạy'),
      }),
    )
    expect(mocks.apiCreate).not.toHaveBeenCalled()
    expect(mocks.apiUpdate).not.toHaveBeenCalled()
    expect(mocks.apiRemove).not.toHaveBeenCalled()
  })

  it('tạo course trạng thái Created và không tạo session khi chỉ có tên và mã', async () => {
    mocks.apiCreate.mockResolvedValue({ id: 'course-new' })
    render(<CourseForm open onClose={vi.fn()} />)

    fillRequiredCourseFields()
    submitForm()

    await waitFor(() => {
      expect(mocks.apiCreate).toHaveBeenCalledOnce()
    })

    expect(mocks.apiCreate).toHaveBeenCalledWith(
      'courses',
      expect.objectContaining({
        name: 'React nâng cao',
        code: 'REACT-01',
        teacherId: null,
        roomId: null,
        startDate: null,
        status: 'Created',
      }),
    )
    expect(mocks.apiCreate).not.toHaveBeenCalledWith(
      'sessions',
      expect.anything(),
    )
  })

  it('tạo course trạng thái Assigned và không tạo session khi chỉ có giảng viên', async () => {
    mocks.apiCreate.mockResolvedValue({ id: 'course-new' })
    render(<CourseForm open onClose={vi.fn()} />)

    fillRequiredCourseFields()
    fireEvent.change(screen.getByLabelText('Giảng viên phụ trách'), {
      target: { value: teacher.id },
    })
    submitForm()

    await waitFor(() => {
      expect(mocks.apiCreate).toHaveBeenCalledOnce()
    })

    expect(mocks.apiCreate).toHaveBeenCalledWith(
      'courses',
      expect.objectContaining({
        teacherId: teacher.id,
        roomId: null,
        startDate: null,
        status: 'Assigned',
      }),
    )
    expect(mocks.apiCreate).not.toHaveBeenCalledWith(
      'sessions',
      expect.anything(),
    )
  })

  it('tạo course và các session khi lịch hợp lệ', async () => {
    const onClose = vi.fn()
    mocks.apiCreate.mockImplementation(
      async (resource: string, payload: Record<string, unknown>) => ({
        ...payload,
        id: resource === 'courses' ? 'course-new' : 'session-new',
      }),
    )
    render(<CourseForm open onClose={onClose} />)

    fillRequiredCourseFields()
    fillScheduleFields()
    fireEvent.change(screen.getByLabelText('Số buổi'), {
      target: { value: '2' },
    })
    submitForm()

    await waitFor(() => {
      expect(mocks.apiCreate).toHaveBeenCalledTimes(3)
    })

    expect(mocks.apiCreate).toHaveBeenNthCalledWith(
      1,
      'courses',
      expect.objectContaining({
        name: 'React nâng cao',
        code: 'REACT-01',
        teacherId: teacher.id,
        roomId: room.id,
        startDate: '2030-06-03',
        endDate: '2030-06-05',
        schedulePattern: '2-4-6',
        startTime: '08:00',
        endTime: '10:00',
        sessionCount: 2,
        status: 'Planned',
      }),
    )
    expect(mocks.apiCreate).toHaveBeenNthCalledWith(
      2,
      'sessions',
      expect.objectContaining({
        courseId: 'course-new',
        teacherId: teacher.id,
        roomId: room.id,
        date: '2030-06-03',
        startTime: '08:00',
        endTime: '10:00',
      }),
    )
    expect(mocks.apiCreate).toHaveBeenNthCalledWith(
      3,
      'sessions',
      expect.objectContaining({
        courseId: 'course-new',
        date: '2030-06-05',
      }),
    )
    expect(mocks.loadAll).toHaveBeenCalledOnce()
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Đã tạo khóa học',
        message: 'Đã tạo 2 buổi học và không phát hiện tranh chấp.',
      }),
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
