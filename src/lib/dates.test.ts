import { describe, expect, it } from 'vitest'

import type {
  ClassSession,
  Course,
  CourseFormData,
  Enrollment,
  Student,
} from '../types/domain'
import {
  findEnrollmentConflict,
  findScheduleConflict,
  generateSessions,
  timesOverlap,
} from './dates'

const baseCourseForm: CourseFormData = {
  name: 'Lập trình căn bản',
  code: 'LTCB',
  description: '',
  teacherId: 'teacher-1',
  roomId: 'room-1',
  startDate: '2025-06-01',
  schedulePattern: '2-4-6',
  startTime: '08:00',
  endTime: '10:00',
  sessionCount: 4,
}

function makeSession(overrides: Partial<ClassSession> = {}): ClassSession {
  return {
    id: 'session-1',
    courseId: 'course-1',
    teacherId: 'teacher-1',
    roomId: 'room-1',
    date: '2025-06-02',
    startTime: '08:00',
    endTime: '10:00',
    ...overrides,
  }
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    name: 'Khóa hiện tại',
    code: 'KH01',
    description: '',
    teacherId: 'teacher-1',
    roomId: 'room-1',
    startDate: '2025-06-02',
    endDate: '2025-06-30',
    schedulePattern: '2-4-6',
    startTime: '08:00',
    endTime: '10:00',
    sessionCount: 12,
    status: 'Planned',
    createdAt: '2025-05-01',
    ...overrides,
  }
}

function makeEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'enrollment-1',
    studentId: 'student-1',
    courseId: 'course-1',
    enrolledAt: '2025-05-20',
    ...overrides,
  }
}

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'student-1',
    name: 'Nguyễn An',
    email: 'an@example.com',
    phone: '0900000000',
    joinedAt: '2025-05-01',
    status: 'active',
    ...overrides,
  }
}

describe('generateSessions', () => {
  it('sinh đúng các buổi thứ 2-4-6 từ ngày bắt đầu', () => {
    const sessions = generateSessions('course-new', baseCourseForm)

    expect(sessions).toEqual([
      {
        courseId: 'course-new',
        teacherId: 'teacher-1',
        roomId: 'room-1',
        date: '2025-06-02',
        startTime: '08:00',
        endTime: '10:00',
      },
      {
        courseId: 'course-new',
        teacherId: 'teacher-1',
        roomId: 'room-1',
        date: '2025-06-04',
        startTime: '08:00',
        endTime: '10:00',
      },
      {
        courseId: 'course-new',
        teacherId: 'teacher-1',
        roomId: 'room-1',
        date: '2025-06-06',
        startTime: '08:00',
        endTime: '10:00',
      },
      {
        courseId: 'course-new',
        teacherId: 'teacher-1',
        roomId: 'room-1',
        date: '2025-06-09',
        startTime: '08:00',
        endTime: '10:00',
      },
    ])
  })

  it('sinh đúng các buổi thứ 3-5-7 từ ngày bắt đầu', () => {
    const sessions = generateSessions('course-new', {
      ...baseCourseForm,
      startDate: '2025-06-02',
      schedulePattern: '3-5-7',
    })

    expect(sessions.map((session) => session.date)).toEqual([
      '2025-06-03',
      '2025-06-05',
      '2025-06-07',
      '2025-06-10',
    ])
  })
})

describe('timesOverlap', () => {
  it('nhận diện hai buổi cùng ngày có thời gian giao nhau', () => {
    expect(
      timesOverlap(
        makeSession({ startTime: '08:00', endTime: '10:00' }),
        makeSession({ startTime: '09:30', endTime: '11:00' }),
      ),
    ).toBe(true)
  })

  it('không xem hai buổi nối tiếp tại thời điểm kết thúc là trùng nhau', () => {
    expect(
      timesOverlap(
        makeSession({ startTime: '08:00', endTime: '10:00' }),
        makeSession({ startTime: '10:00', endTime: '12:00' }),
      ),
    ).toBe(false)
  })

  it('không xem cùng khung giờ ở hai ngày khác nhau là trùng nhau', () => {
    expect(
      timesOverlap(
        makeSession({ date: '2025-06-02' }),
        makeSession({ date: '2025-06-03' }),
      ),
    ).toBe(false)
  })
})

describe('findScheduleConflict', () => {
  const proposed = [
    {
      courseId: 'course-edit',
      teacherId: 'teacher-1',
      roomId: 'room-new',
      date: '2025-06-02',
      startTime: '09:00',
      endTime: '11:00',
    },
  ]

  it('báo trùng lịch giảng viên', () => {
    const conflict = findScheduleConflict(
      proposed,
      [makeSession({ teacherId: 'teacher-1', roomId: 'room-other' })],
      [makeCourse({ name: 'Khóa đang dạy' })],
      [],
      [],
    )

    expect(conflict).toContain('Giảng viên đã có lịch dạy')
    expect(conflict).toContain('Khóa đang dạy')
  })

  it('báo trùng lịch phòng học', () => {
    const conflict = findScheduleConflict(
      [{ ...proposed[0], teacherId: 'teacher-new', roomId: 'room-1' }],
      [makeSession({ teacherId: 'teacher-other', roomId: 'room-1' })],
      [makeCourse({ name: 'Khóa đang dùng phòng' })],
      [],
      [],
    )

    expect(conflict).toContain('Phòng học đã được sử dụng')
    expect(conflict).toContain('Khóa đang dùng phòng')
  })

  it('báo học viên của khóa đang chỉnh sửa có khóa khác trùng lịch', () => {
    const conflict = findScheduleConflict(
      [{ ...proposed[0], teacherId: 'teacher-new', roomId: 'room-new' }],
      [
        makeSession({
          courseId: 'course-other',
          teacherId: 'teacher-other',
          roomId: 'room-other',
        }),
      ],
      [makeCourse({ id: 'course-other', name: 'Khóa khác' })],
      [
        makeEnrollment({ id: 'enrollment-edit', courseId: 'course-edit' }),
        makeEnrollment({ id: 'enrollment-other', courseId: 'course-other' }),
      ],
      [makeStudent()],
      'course-edit',
    )

    expect(conflict).toContain('Học viên Nguyễn An')
    expect(conflict).toContain('có khóa học khác trùng lịch')
  })
})

describe('findEnrollmentConflict', () => {
  const sessions = [
    makeSession({
      id: 'session-target',
      courseId: 'course-target',
      teacherId: 'teacher-target',
      roomId: 'room-target',
      startTime: '09:00',
      endTime: '11:00',
    }),
    makeSession({
      id: 'session-current',
      courseId: 'course-current',
      teacherId: 'teacher-current',
      roomId: 'room-current',
    }),
  ]

  it('báo khóa học hiện có khi học viên ghi danh vào khóa trùng lịch', () => {
    const conflict = findEnrollmentConflict(
      'student-1',
      'course-target',
      sessions,
      [makeEnrollment({ courseId: 'course-current' })],
      [makeCourse({ id: 'course-current', name: 'Khóa đã ghi danh' })],
    )

    expect(conflict).toContain('Học viên đã có lịch học')
    expect(conflict).toContain('Khóa đã ghi danh')
  })

  it('không báo xung đột khi khóa mục tiêu bắt đầu lúc buổi hiện có kết thúc', () => {
    const conflict = findEnrollmentConflict(
      'student-1',
      'course-target',
      [
        makeSession({
          id: 'session-target',
          courseId: 'course-target',
          startTime: '10:00',
          endTime: '12:00',
        }),
        makeSession({
          id: 'session-current',
          courseId: 'course-current',
          startTime: '08:00',
          endTime: '10:00',
        }),
      ],
      [makeEnrollment({ courseId: 'course-current' })],
      [makeCourse({ id: 'course-current' })],
    )

    expect(conflict).toBeNull()
  })
})
