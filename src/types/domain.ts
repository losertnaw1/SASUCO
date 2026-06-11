export type EntityId = string
export type CourseStatus = 'Created' | 'Assigned' | 'Planned' | 'In-Progress'
export type SchedulePattern = '2-4-6' | '3-5-7'
export type EnrollmentStatus = 'active' | 'paused' | 'cancelled'

export interface Teacher {
  id: EntityId
  name: string
  email: string
  phone: string
  specialty: string
  status: 'active' | 'inactive'
}

export interface Student {
  id: EntityId
  name: string
  email: string
  phone: string
  joinedAt: string
  status: 'active' | 'inactive'
}

export interface Room {
  id: EntityId
  name: string
  capacity: number
  status: 'active' | 'inactive'
}

export interface Course {
  id: EntityId
  name: string
  code: string
  description: string
  teacherId: EntityId | null
  roomId: EntityId | null
  startDate: string | null
  endDate: string | null
  schedulePattern: SchedulePattern | null
  startTime: string | null
  endTime: string | null
  sessionCount: number
  status: CourseStatus
  createdAt: string
}

export interface ClassSession {
  id: EntityId
  courseId: EntityId
  teacherId: EntityId
  roomId: EntityId
  date: string
  startTime: string
  endTime: string
}

export interface Enrollment {
  id: EntityId
  studentId: EntityId
  courseId: EntityId
  enrolledAt: string
  status: EnrollmentStatus
}

export interface AppSettings {
  id: 'app'
  teacherWeeklySessionLimit: number
  pageSize: number
}

export interface CourseFormData {
  name: string
  code: string
  description: string
  teacherId: string
  roomId: string
  startDate: string
  schedulePattern: SchedulePattern
  startTime: string
  endTime: string
  sessionCount: number
}
