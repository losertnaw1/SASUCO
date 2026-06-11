import type {
  ClassSession,
  Course,
  CourseFormData,
  Enrollment,
  Room,
  SchedulePattern,
  Student,
  Teacher,
} from '../types/domain'

const patternDays: Record<SchedulePattern, number[]> = {
  '2-4-6': [1, 3, 5],
  '3-5-7': [2, 4, 6],
}

export function formatDate(date: string | null) {
  if (!date) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${date}T00:00:00`))
}

export function formatDateTime(date: string, time: string) {
  return `${time} · ${formatDate(date)}`
}

export function getToday() {
  return toLocalDateKey(new Date())
}

export function deriveCourseStatus(course: Course): Course['status'] {
  if (
    course.teacherId &&
    course.roomId &&
    course.startDate &&
    course.startTime &&
    course.endTime
  ) {
    return course.startDate <= getToday() ? 'In-Progress' : 'Planned'
  }
  return course.teacherId ? 'Assigned' : 'Created'
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function generateSessions(
  courseId: string,
  data: CourseFormData,
): Omit<ClassSession, 'id'>[] {
  const sessions: Omit<ClassSession, 'id'>[] = []
  const cursor = new Date(`${data.startDate}T00:00:00`)
  const allowedDays = patternDays[data.schedulePattern]

  while (sessions.length < data.sessionCount) {
    if (allowedDays.includes(cursor.getDay())) {
      sessions.push({
        courseId,
        teacherId: data.teacherId,
        roomId: data.roomId,
        date: toLocalDateKey(cursor),
        startTime: data.startTime,
        endTime: data.endTime,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return sessions
}

export function timesOverlap(
  first: Pick<ClassSession, 'date' | 'startTime' | 'endTime'>,
  second: Pick<ClassSession, 'date' | 'startTime' | 'endTime'>,
) {
  return (
    first.date === second.date &&
    first.startTime < second.endTime &&
    second.startTime < first.endTime
  )
}

export function findScheduleConflict(
  proposed: Omit<ClassSession, 'id'>[],
  existing: ClassSession[],
  courses: Course[],
  enrollments: Enrollment[],
  students: Student[],
  ignoredCourseId?: string,
  teachers: Teacher[] = [],
  rooms: Room[] = [],
) {
  for (const next of proposed) {
    for (const current of existing) {
      if (current.courseId === ignoredCourseId || !timesOverlap(next, current)) {
        continue
      }

      const currentCourse =
        courses.find((course) => course.id === current.courseId)?.name ??
        'khóa học khác'
      const currentTeacher =
        teachers.find((teacher) => teacher.id === current.teacherId)?.name ??
        current.teacherId
      const currentRoom =
        rooms.find((room) => room.id === current.roomId)?.name ?? current.roomId
      const time = `${current.startTime}-${current.endTime}, ngày ${formatDate(current.date)}`

      if (next.teacherId === current.teacherId) {
        return `Giảng viên ${currentTeacher} bị trùng với khóa “${currentCourse}” tại ${currentRoom}, lúc ${time}.`
      }

      if (next.roomId === current.roomId) {
        return `Phòng ${currentRoom} bị trùng với khóa “${currentCourse}” do giảng viên ${currentTeacher} phụ trách, lúc ${time}.`
      }
    }
  }

  const proposedStudentIds = enrollments
    .filter((item) => item.courseId === ignoredCourseId)
    .map((item) => item.studentId)

  for (const studentId of proposedStudentIds) {
    const enrolledCourseIds = enrollments
      .filter(
        (item) => item.studentId === studentId && item.courseId !== ignoredCourseId,
      )
      .map((item) => item.courseId)

    const studentSessions = existing.filter((item) =>
      enrolledCourseIds.includes(item.courseId),
    )
    const conflict = proposed.find((next) =>
      studentSessions.some((item) => timesOverlap(next, item)),
    )

    if (conflict) {
      const student = students.find((item) => item.id === studentId)?.name
      const otherSession = studentSessions.find((item) => timesOverlap(conflict, item))
      const otherCourse =
        courses.find((item) => item.id === otherSession?.courseId)?.name ??
        'khóa học khác'
      const room =
        rooms.find((item) => item.id === otherSession?.roomId)?.name ??
        otherSession?.roomId ??
        'phòng chưa xác định'
      return `Học viên ${student ?? 'đã ghi danh'} bị trùng với khóa “${otherCourse}” tại ${room}, lúc ${otherSession?.startTime}-${otherSession?.endTime}, ngày ${formatDate(otherSession?.date ?? conflict.date)}.`
    }
  }

  return null
}

export function findEnrollmentConflict(
  studentId: string,
  targetCourseId: string,
  sessions: ClassSession[],
  enrollments: Enrollment[],
  courses: Course[],
  rooms: Room[] = [],
) {
  const targetSessions = sessions.filter((item) => item.courseId === targetCourseId)
  const enrolledCourseIds = enrollments
    .filter((item) => item.studentId === studentId)
    .map((item) => item.courseId)

  for (const current of sessions.filter((item) =>
    enrolledCourseIds.includes(item.courseId),
  )) {
    const conflict = targetSessions.find((item) => timesOverlap(item, current))
    if (conflict) {
      const courseName =
        courses.find((course) => course.id === current.courseId)?.name ??
        'khóa học khác'
      const room =
        rooms.find((item) => item.id === current.roomId)?.name ?? current.roomId
      return `Học viên đã có lịch học “${courseName}” tại ${room}, lúc ${current.startTime}-${current.endTime}, ngày ${formatDate(current.date)}.`
    }
  }

  return null
}

export function startOfWeek(date = new Date()) {
  const result = new Date(date)
  const day = result.getDay() || 7
  result.setDate(result.getDate() - day + 1)
  result.setHours(0, 0, 0, 0)
  return result
}

export function sessionsInCurrentWeek(sessions: ClassSession[]) {
  const from = startOfWeek()
  const to = new Date(from)
  to.setDate(to.getDate() + 7)
  return sessions.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`)
    return date >= from && date < to
  })
}
