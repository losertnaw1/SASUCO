import {
  BookOpenText,
  CalendarDays,
  Download,
  Edit3,
  Eye,
  Filter,
  GraduationCap,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { CourseForm } from '../components/forms/CourseForm'
import { Modal } from '../components/shared/Modal'
import { PageIntro } from '../components/shared/PageIntro'
import { Pagination } from '../components/shared/Pagination'
import { SearchInput } from '../components/shared/SearchInput'
import { StatusBadge } from '../components/shared/StatusBadge'
import { api } from '../lib/api'
import { formatDate } from '../lib/dates'
import { matchesSearch } from '../lib/search'
import { exportCourseStudentsReport } from '../lib/reports'
import { useDataStore } from '../store/useDataStore'
import { useToastStore } from '../store/useToastStore'
import type { Course, CourseStatus } from '../types/domain'

type StatusFilter = CourseStatus | 'all'

export function CoursesPage() {
  const {
    courses,
    teachers,
    rooms,
    sessions,
    enrollments,
    students,
    settings,
    loadAll,
  } = useDataStore()
  const showToast = useToastStore((state) => state.showToast)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [editingCourse, setEditingCourse] = useState<Course | null | undefined>()
  const [detailCourse, setDetailCourse] = useState<Course | null>(null)

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const teacher = teachers.find((item) => item.id === course.teacherId)?.name
      return (
        matchesSearch(search, [course.name, course.code, teacher]) &&
        (status === 'all' || course.status === status)
      )
    })
  }, [courses, search, status, teachers])

  const visible = filtered.slice(
    (page - 1) * settings.pageSize,
    page * settings.pageSize,
  )

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const removeCourse = async (course: Course) => {
    if (!window.confirm(`Xóa khóa học “${course.name}” và toàn bộ lịch liên quan?`)) {
      return
    }
    try {
      const relatedSessions = sessions.filter((item) => item.courseId === course.id)
      const relatedEnrollments = enrollments.filter(
        (item) => item.courseId === course.id,
      )
      await Promise.all([
        ...relatedSessions.map((item) => api.remove('sessions', item.id)),
        ...relatedEnrollments.map((item) => api.remove('enrollments', item.id)),
      ])
      await api.remove('courses', course.id)
      await loadAll()
      showToast({
        type: 'success',
        title: 'Đã xóa khóa học',
        message: 'Lịch học và danh sách ghi danh liên quan cũng đã được xóa.',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể xóa khóa học',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    }
  }

  const courseSessions = detailCourse
    ? sessions
        .filter((item) => item.courseId === detailCourse.id)
        .sort((a, b) => a.date.localeCompare(b.date))
    : []
  const courseStudentRows = detailCourse
    ? enrollments
        .filter((item) => item.courseId === detailCourse.id)
        .map((enrollment) => ({
          enrollment,
          student: students.find((student) => student.id === enrollment.studentId),
        }))
        .filter((item) => item.student)
    : []

  const exportStudents = async () => {
    if (!detailCourse) return
    try {
      await exportCourseStudentsReport(detailCourse, students, enrollments)
      showToast({
        type: 'success',
        title: 'Đã xuất báo cáo Excel',
        message: `Danh sách học viên khóa “${detailCourse.name}” đã được tải xuống.`,
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể xuất báo cáo Excel',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageIntro
        eyebrow="Đào tạo"
        title="Quản lý khóa học"
        description="Tạo khóa học, phân công giảng viên, chọn phòng và lên lịch từng buổi với kiểm tra tranh chấp tự động."
        actionLabel="Tạo khóa học"
        onAction={() => setEditingCourse(null)}
        icon={BookOpenText}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={updateSearch}
            placeholder="Tìm theo tên, mã hoặc giảng viên..."
          />
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500">
            <Filter size={15} />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter)
                setPage(1)
              }}
              className="bg-transparent outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Created">Đã tạo</option>
              <option value="Assigned">Đã gán giảng viên</option>
              <option value="Planned">Đã lên lịch</option>
              <option value="In-Progress">Đang diễn ra</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Khóa học</th>
                <th className="px-5 py-3.5">Giảng viên</th>
                <th className="px-5 py-3.5">Lịch học</th>
                <th className="px-5 py-3.5">Học viên</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((course) => {
                const teacher = teachers.find((item) => item.id === course.teacherId)
                const room = rooms.find((item) => item.id === course.roomId)
                const studentCount = enrollments.filter(
                  (item) => item.courseId === course.id,
                ).length
                return (
                  <tr key={course.id} className="text-xs text-slate-600 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{course.name}</p>
                      <p className="mt-1 text-[10px] font-semibold text-indigo-500">
                        {course.code}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700">
                        {teacher?.name ?? 'Chưa phân công'}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {teacher?.specialty ?? 'Cần gán giảng viên'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700">
                        {course.schedulePattern
                          ? `Thứ ${course.schedulePattern.split('-').join(' - ')}`
                          : 'Chưa lên lịch'}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {course.startTime && course.endTime
                          ? `${course.startTime} - ${course.endTime} · ${room?.name}`
                          : 'Chưa chọn phòng và giờ học'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <UsersRound size={14} className="text-slate-400" />
                        {studentCount}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label="Xem chi tiết"
                          onClick={() => setDetailCourse(course)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          aria-label="Chỉnh sửa"
                          onClick={() => setEditingCourse(course)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          aria-label="Xóa"
                          onClick={() => removeCourse(course)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="py-16 text-center text-xs text-slate-400">
              Không tìm thấy khóa học phù hợp.
            </p>
          )}
        </div>
        <Pagination
          page={page}
          pageSize={settings.pageSize}
          total={filtered.length}
          onPageChange={setPage}
        />
      </section>

      <CourseForm
        open={editingCourse !== undefined}
        course={editingCourse}
        onClose={() => setEditingCourse(undefined)}
      />

      <Modal
        open={Boolean(detailCourse)}
        onClose={() => setDetailCourse(null)}
        title={detailCourse?.name ?? ''}
        description={`${detailCourse?.code ?? ''} · Khai giảng ${formatDate(detailCourse?.startDate ?? null)}`}
        size="xl"
      >
        {detailCourse && (
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <section>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <CalendarDays size={17} className="text-indigo-500" />
                  Lịch các buổi học
                </h3>
                <StatusBadge status={detailCourse.status} />
              </div>
              <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {courseSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs"
                  >
                    <span className="font-bold text-slate-700">Buổi {index + 1}</span>
                    <span className="text-slate-500">
                      {formatDate(session.date)} · {session.startTime} -{' '}
                      {session.endTime}
                    </span>
                  </div>
                ))}
                {courseSessions.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    Khóa học chưa được lên lịch.
                  </p>
                )}
              </div>
            </section>
            <section>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <GraduationCap size={17} className="text-indigo-500" />
                Học viên đã ghi danh ({courseStudentRows.length})
              </h3>
              <button
                onClick={exportStudents}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-[11px] font-bold text-white"
              >
                <Download size={14} /> Xuất danh sách học viên Excel
              </button>
              <div className="mt-4 space-y-2">
                {courseStudentRows.map(({ student, enrollment }) => (
                  <div
                    key={student!.id}
                    className="rounded-xl border border-slate-100 px-3 py-2.5"
                  >
                    <p className="text-xs font-bold text-slate-700">{student!.name}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{student!.email}</p>
                    <p className="mt-1 text-[10px] font-semibold text-indigo-500">
                      {enrollment.status === 'paused'
                        ? 'Đăng ký tạm ngừng'
                        : enrollment.status === 'cancelled'
                          ? 'Đã hủy đăng ký'
                          : 'Đang đăng ký'}
                    </p>
                  </div>
                ))}
                {courseStudentRows.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    Chưa có học viên ghi danh.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  )
}
