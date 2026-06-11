import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  Settings2,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import { SectionHeader } from '../components/ui/SectionHeader'
import { formatDate, getToday, sessionsInCurrentWeek } from '../lib/dates'
import { useAppStore } from '../store/useAppStore'
import { useDataStore } from '../store/useDataStore'

export function DashboardPage() {
  const { courses, teachers, students, rooms, sessions, enrollments, settings } =
    useDataStore()
  const setActivePage = useAppStore((state) => state.setActivePage)
  const today = getToday()
  const weekSessions = sessionsInCurrentWeek(sessions)
  const todaySessions = sessions
    .filter((item) => item.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const overloadedTeachers = teachers
    .map((teacher) => ({
      teacher,
      count: weekSessions.filter((item) => item.teacherId === teacher.id).length,
    }))
    .filter((item) => item.count >= settings.teacherWeeklySessionLimit)
    .sort((a, b) => b.count - a.count)
  const plannedCourses = courses.filter(
    (item) => item.status === 'Planned' || item.status === 'In-Progress',
  )
  const roomRisks = plannedCourses
    .map((course) => {
      const room = rooms.find((item) => item.id === course.roomId)
      const enrolled = enrollments.filter(
        (item) => item.courseId === course.id && item.status === 'active',
      ).length
      return {
        course,
        room,
        enrolled,
        percent: room ? Math.round((enrolled / room.capacity) * 100) : 0,
      }
    })
    .filter((item) => item.room && item.percent >= 90)
    .sort((a, b) => b.percent - a.percent)

  const stats = [
    {
      label: 'Tổng học viên',
      value: students.length,
      note: `${enrollments.length} lượt ghi danh`,
      icon: UsersRound,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Khóa đã lên lịch',
      value: plannedCourses.length,
      note: `${courses.length} khóa trong hệ thống`,
      icon: BookOpenCheck,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Giảng viên',
      value: teachers.filter((item) => item.status === 'active').length,
      note: `${overloadedTeachers.length} người cần chú ý`,
      icon: UserRoundCheck,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Phòng học',
      value: rooms.filter((item) => item.status === 'active').length,
      note: `${todaySessions.length} buổi hôm nay`,
      icon: CalendarDays,
      color: 'bg-rose-50 text-rose-600',
    },
  ]

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-200/60 sm:flex-row sm:items-center lg:p-8">
        <div>
          <p className="text-xs font-semibold text-indigo-100">
            Dữ liệu vận hành cập nhật từ JSON Server
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Tổng quan trung tâm đào tạo
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/85">
            Theo dõi lịch học, phân công giảng viên và các cảnh báo tải công việc
            trong một màn hình.
          </p>
        </div>
        <button
          onClick={() => setActivePage('courses')}
          className="self-start rounded-xl bg-white px-4 py-3 text-xs font-bold text-indigo-700 shadow-lg sm:self-auto"
        >
          Quản lý khóa học
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${stat.color}`}>
                <Icon size={21} />
              </span>
              <p className="mt-5 text-xs font-semibold text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                {stat.value}
              </p>
              <p className="mt-2 text-[10px] text-slate-400">{stat.note}</p>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader title="Cảnh báo tải giảng viên tuần này" />
          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
            <span>Ngưỡng hiện tại: ≥ {settings.teacherWeeklySessionLimit} buổi/tuần</span>
            <button
              onClick={() => setActivePage('settings')}
              className="flex items-center gap-1 font-bold text-indigo-600"
            >
              <Settings2 size={12} /> Thay đổi
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {overloadedTeachers.map(({ teacher, count }) => (
              <div
                key={teacher.id}
                className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-rose-500">
                  <AlertTriangle size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {teacher.name}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">{teacher.specialty}</p>
                </div>
                <span className="text-xs font-black text-rose-600">{count} buổi</span>
              </div>
            ))}
            {overloadedTeachers.length === 0 && (
              <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center text-xs text-emerald-700">
                Không có giảng viên nào đạt ngưỡng quá tải trong tuần này.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader title="Cảnh báo sức chứa phòng" />
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
            Cảnh báo khi một lớp đạt từ 90% sức chứa phòng.
          </p>
          <div className="mt-4 space-y-3">
            {roomRisks.map(({ course, room, enrolled, percent }) => (
              <div
                key={course.id}
                className={`rounded-xl border p-3 ${
                  percent > 100
                    ? 'border-rose-100 bg-rose-50'
                    : 'border-amber-100 bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={17}
                    className={percent > 100 ? 'text-rose-500' : 'text-amber-500'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">
                      {room?.name} · {course.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {enrolled}/{room?.capacity} học viên · {percent}% sức chứa
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {roomRisks.length === 0 && (
              <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center text-xs text-emerald-700">
                Không có phòng học nào gần hoặc vượt sức chứa.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeader
            title="Lịch học hôm nay"
            action="Xem khóa học"
            onAction={() => setActivePage('courses')}
          />
          <div className="mt-4 space-y-3">
            {todaySessions.map((session) => {
              const course = courses.find((item) => item.id === session.courseId)
              const teacher = teachers.find((item) => item.id === session.teacherId)
              const room = rooms.find((item) => item.id === session.roomId)
              return (
                <div key={session.id} className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-slate-700">
                      {session.startTime}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{course?.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock3 size={11} /> {teacher?.name} · {room?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            {todaySessions.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Không có buổi học nào vào hôm nay, {formatDate(today)}.
              </p>
            )}
          </div>
        </article>
      </section>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeader
          title="Khóa học đang vận hành"
          action="Quản lý khóa học"
          onAction={() => setActivePage('courses')}
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plannedCourses.map((course) => {
            const teacher = teachers.find((item) => item.id === course.teacherId)
            return (
              <div key={course.id} className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs font-bold text-slate-800">{course.name}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {teacher?.name} · {course.sessionCount} buổi
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (sessions.filter(
                          (item) => item.courseId === course.id && item.date <= today,
                        ).length /
                          course.sessionCount) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </article>
    </div>
  )
}
