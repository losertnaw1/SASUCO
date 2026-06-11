import { create } from 'zustand'
import { api } from '../lib/api'
import { deriveCourseStatus } from '../lib/dates'
import type {
  AppSettings,
  ClassSession,
  Course,
  Enrollment,
  Room,
  Student,
  Teacher,
} from '../types/domain'

interface DataState {
  teachers: Teacher[]
  students: Student[]
  rooms: Room[]
  courses: Course[]
  sessions: ClassSession[]
  enrollments: Enrollment[]
  settings: AppSettings
  isLoading: boolean
  isLoaded: boolean
  error: string | null
  loadAll: () => Promise<void>
}

export const useDataStore = create<DataState>((set) => ({
  teachers: [],
  students: [],
  rooms: [],
  courses: [],
  sessions: [],
  enrollments: [],
  settings: { id: 'app', teacherWeeklySessionLimit: 6, pageSize: 5 },
  isLoading: false,
  isLoaded: false,
  error: null,
  loadAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const [
        teachers,
        students,
        rooms,
        courses,
        sessions,
        enrollments,
        settings,
      ] = await Promise.all([
        api.list<Teacher>('teachers'),
        api.list<Student>('students'),
        api.list<Room>('rooms'),
        api.list<Course>('courses'),
        api.list<ClassSession>('sessions'),
        api.list<Enrollment>('enrollments'),
        api.list<AppSettings>('settings'),
      ])
      set({
        teachers,
        students,
        rooms,
        courses: courses.map((course) => ({
          ...course,
          status: deriveCourseStatus(course),
        })),
        sessions,
        enrollments: enrollments.map((enrollment) => ({
          ...enrollment,
          status: enrollment.status ?? 'active',
        })),
        settings: settings[0] ?? {
          id: 'app',
          teacherWeeklySessionLimit: 6,
          pageSize: 5,
        },
        isLoading: false,
        isLoaded: true,
      })
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Không thể kết nối JSON Server.',
      })
    }
  },
}))
