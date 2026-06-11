import {
  AlertTriangle,
  Edit3,
  FileSpreadsheet,
  Mail,
  Phone,
  Trash2,
  UserRoundCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { TeacherForm } from '../components/forms/TeacherForm'
import { PageIntro } from '../components/shared/PageIntro'
import { Pagination } from '../components/shared/Pagination'
import { SearchInput } from '../components/shared/SearchInput'
import { api } from '../lib/api'
import { sessionsInCurrentWeek } from '../lib/dates'
import { matchesSearch } from '../lib/search'
import { exportTeacherScheduleReport } from '../lib/reports'
import { useDataStore } from '../store/useDataStore'
import { useToastStore } from '../store/useToastStore'
import type { Teacher } from '../types/domain'

export function StaffPage() {
  const { teachers, courses, sessions, rooms, settings, loadAll } = useDataStore()
  const showToast = useToastStore((state) => state.showToast)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Teacher | null | undefined>()
  const weekSessions = sessionsInCurrentWeek(sessions)

  const filtered = useMemo(() => {
    return teachers.filter((teacher) =>
      matchesSearch(search, [
        teacher.name,
        teacher.email,
        teacher.phone,
        teacher.specialty,
      ]),
    )
  }, [search, teachers])
  const visible = filtered.slice(
    (page - 1) * settings.pageSize,
    page * settings.pageSize,
  )

  const remove = async (teacher: Teacher) => {
    const assignedCourse = courses.find((course) => course.teacherId === teacher.id)
    if (assignedCourse) {
      showToast({
        type: 'error',
        title: 'Không thể xóa giảng viên',
        message: `Giảng viên đang phụ trách khóa “${assignedCourse.name}”. Hãy đổi phân công trước.`,
      })
      return
    }
    if (!window.confirm(`Xóa giảng viên “${teacher.name}”?`)) return
    try {
      await api.remove('teachers', teacher.id)
      await loadAll()
      showToast({ type: 'success', title: 'Đã xóa giảng viên' })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể xóa giảng viên',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    }
  }

  const exportSchedule = async (teacher: Teacher) => {
    try {
      await exportTeacherScheduleReport(teacher, courses, sessions, rooms)
      showToast({
        type: 'success',
        title: 'Đã xuất báo cáo Excel',
        message: `Lịch dạy của giảng viên ${teacher.name} đã được tải xuống.`,
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
        eyebrow="Nhân sự"
        title="Quản lý giảng viên"
        description="Quản lý hồ sơ chuyên môn và theo dõi tải giảng dạy thực tế trong tuần."
        actionLabel="Thêm giảng viên"
        onAction={() => setEditing(null)}
        icon={UserRoundCheck}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Tìm tên, email, số điện thoại, chuyên môn..."
          />
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((teacher) => {
            const workload = weekSessions.filter(
              (session) => session.teacherId === teacher.id,
            ).length
            const overloaded = workload >= settings.teacherWeeklySessionLimit
            return (
              <article
                key={teacher.id}
                className="rounded-2xl border border-slate-100 p-4 transition hover:border-indigo-100 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {teacher.name}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-indigo-500">
                      {teacher.specialty}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                      teacher.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {teacher.status === 'active' ? 'Đang làm việc' : 'Tạm nghỉ'}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-[11px] text-slate-500">
                  <p className="flex items-center gap-2">
                    <Mail size={13} /> {teacher.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={13} /> {teacher.phone}
                  </p>
                </div>
                <div
                  className={`mt-4 flex items-center justify-between rounded-xl p-3 ${
                    overloaded ? 'bg-rose-50' : 'bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Lịch dạy tuần này
                    </p>
                    <p
                      className={`mt-1 text-sm font-black ${
                        overloaded ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {workload} buổi
                    </p>
                  </div>
                  {overloaded && <AlertTriangle size={19} className="text-rose-500" />}
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-3">
                  <button
                    title="Xuất lịch dạy Excel"
                    onClick={() => exportSchedule(teacher)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <FileSpreadsheet size={15} />
                  </button>
                  <button
                    onClick={() => setEditing(teacher)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => remove(teacher)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
        {visible.length === 0 && (
          <p className="py-14 text-center text-xs text-slate-400">
            Không tìm thấy giảng viên phù hợp.
          </p>
        )}
        <Pagination
          page={page}
          pageSize={settings.pageSize}
          total={filtered.length}
          onPageChange={setPage}
        />
      </section>
      <TeacherForm
        open={editing !== undefined}
        teacher={editing}
        onClose={() => setEditing(undefined)}
      />
    </div>
  )
}
