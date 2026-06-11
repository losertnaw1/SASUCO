import {
  BookPlus,
  Edit3,
  GraduationCap,
  Mail,
  Phone,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { EnrollmentForm } from '../components/forms/EnrollmentForm'
import { StudentForm } from '../components/forms/StudentForm'
import { PageIntro } from '../components/shared/PageIntro'
import { Pagination } from '../components/shared/Pagination'
import { SearchInput } from '../components/shared/SearchInput'
import { api } from '../lib/api'
import { formatDate } from '../lib/dates'
import { matchesSearch } from '../lib/search'
import { useDataStore } from '../store/useDataStore'
import { useToastStore } from '../store/useToastStore'
import type { Student } from '../types/domain'

export function StudentsPage() {
  const { students, courses, enrollments, settings, loadAll } = useDataStore()
  const showToast = useToastStore((state) => state.showToast)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Student | null | undefined>()
  const [enrolling, setEnrolling] = useState<Student | null>(null)

  const filtered = useMemo(() => {
    return students.filter((student) =>
      matchesSearch(search, [student.name, student.email, student.phone]),
    )
  }, [search, students])
  const visible = filtered.slice(
    (page - 1) * settings.pageSize,
    page * settings.pageSize,
  )

  const remove = async (student: Student) => {
    if (!window.confirm(`Xóa học viên “${student.name}” và các ghi danh liên quan?`)) {
      return
    }
    try {
      const related = enrollments.filter((item) => item.studentId === student.id)
      await Promise.all(related.map((item) => api.remove('enrollments', item.id)))
      await api.remove('students', student.id)
      await loadAll()
      showToast({ type: 'success', title: 'Đã xóa học viên' })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể xóa học viên',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageIntro
        eyebrow="Học viên"
        title="Quản lý học viên"
        description="Quản lý hồ sơ, ghi danh khóa học và tự động ngăn học viên đăng ký các lịch học trùng nhau."
        actionLabel="Thêm học viên"
        onAction={() => setEditing(null)}
        icon={UsersRound}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Học viên</th>
                <th className="px-5 py-3.5">Liên hệ</th>
                <th className="px-5 py-3.5">Khóa đang học</th>
                <th className="px-5 py-3.5">Ngày tham gia</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((student) => {
                const studentCourses = enrollments
                  .filter(
                    (item) =>
                      item.studentId === student.id && item.status !== 'cancelled',
                  )
                  .map((item) => courses.find((course) => course.id === item.courseId))
                  .filter(Boolean)
                return (
                  <tr key={student.id} className="text-xs text-slate-600 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{student.name}</p>
                      <p className="mt-1 text-[10px] text-slate-400">ID: {student.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5">
                        <Mail size={12} /> {student.email}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5">
                        <Phone size={12} /> {student.phone}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 font-bold text-indigo-600">
                        <GraduationCap size={14} /> {studentCourses.length} khóa
                      </p>
                      <p className="mt-1 max-w-48 truncate text-[10px] text-slate-400">
                        {studentCourses.map((item) => item!.name).join(', ') ||
                          'Chưa ghi danh'}
                      </p>
                    </td>
                    <td className="px-5 py-4">{formatDate(student.joinedAt)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {student.status === 'active' ? 'Đang học' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          title={
                            student.status === 'inactive'
                              ? 'Học viên tạm ngừng không thể ghi danh'
                              : 'Ghi danh khóa học'
                          }
                          disabled={student.status === 'inactive'}
                          onClick={() => setEnrolling(student)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <BookPlus size={15} />
                        </button>
                        <button
                          title="Chỉnh sửa"
                          onClick={() => setEditing(student)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          title="Xóa"
                          onClick={() => remove(student)}
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
            <p className="py-14 text-center text-xs text-slate-400">
              Không tìm thấy học viên phù hợp.
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
      <StudentForm
        open={editing !== undefined}
        student={editing}
        onClose={() => setEditing(undefined)}
      />
      <EnrollmentForm student={enrolling} onClose={() => setEnrolling(null)} />
    </div>
  )
}
