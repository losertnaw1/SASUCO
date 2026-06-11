import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import {
  findScheduleConflict,
  generateSessions,
  getToday,
} from '../../lib/dates'
import { useDataStore } from '../../store/useDataStore'
import { useToastStore } from '../../store/useToastStore'
import type {
  ClassSession,
  Course,
  CourseFormData,
  CourseStatus,
  SchedulePattern,
} from '../../types/domain'
import { Modal } from '../shared/Modal'

interface CourseFormProps {
  open: boolean
  course?: Course | null
  onClose: () => void
}

const emptyForm: CourseFormData = {
  name: '',
  code: '',
  description: '',
  teacherId: '',
  roomId: '',
  startDate: '',
  schedulePattern: '2-4-6',
  startTime: '08:00',
  endTime: '10:00',
  sessionCount: 12,
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60'

function statusFromForm(form: CourseFormData): CourseStatus {
  if (
    form.teacherId &&
    form.roomId &&
    form.startDate &&
    form.startTime &&
    form.endTime
  ) {
    return form.startDate <= getToday() ? 'In-Progress' : 'Planned'
  }
  return form.teacherId ? 'Assigned' : 'Created'
}

export function CourseForm({ open, course, onClose }: CourseFormProps) {
  const {
    teachers,
    rooms,
    courses,
    sessions,
    enrollments,
    students,
    loadAll,
  } = useDataStore()
  const showToast = useToastStore((state) => state.showToast)
  const [form, setForm] = useState<CourseFormData>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      course
        ? {
            name: course.name,
            code: course.code,
            description: course.description,
            teacherId: course.teacherId ?? '',
            roomId: course.roomId ?? '',
            startDate: course.startDate ?? '',
            schedulePattern: course.schedulePattern ?? '2-4-6',
            startTime: course.startTime ?? '08:00',
            endTime: course.endTime ?? '10:00',
            sessionCount: course.sessionCount,
          }
        : emptyForm,
    )
  }, [course, open])

  const preview = useMemo(() => {
    if (
      !form.teacherId ||
      !form.roomId ||
      !form.startDate ||
      !form.startTime ||
      !form.endTime ||
      form.sessionCount < 1
    ) {
      return []
    }
    return generateSessions(course?.id ?? 'preview', form)
  }, [course?.id, form])

  const update = <K extends keyof CourseFormData>(
    key: K,
    value: CourseFormData[K],
  ) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim() || !form.code.trim()) {
      showToast({
        type: 'error',
        title: 'Thiếu thông tin khóa học',
        message: 'Tên khóa học và mã khóa học là bắt buộc.',
      })
      return
    }

    const selectedTeacher = teachers.find((item) => item.id === form.teacherId)
    if (selectedTeacher?.status === 'inactive') {
      showToast({
        type: 'error',
        title: 'Không thể phân công giảng viên tạm nghỉ',
        message: `Giảng viên ${selectedTeacher.name} đang tạm nghỉ. Hãy kích hoạt hồ sơ hoặc chọn giảng viên khác.`,
      })
      return
    }

    const selectedRoom = rooms.find((item) => item.id === form.roomId)
    if (selectedRoom?.status === 'inactive') {
      showToast({
        type: 'error',
        title: 'Phòng học đang tạm ngừng',
        message: `Phòng ${selectedRoom.name} hiện không thể sử dụng.`,
      })
      return
    }
    const activeStudentCount = enrollments.filter(
      (item) => item.courseId === course?.id && item.status === 'active',
    ).length
    if (selectedRoom && activeStudentCount > selectedRoom.capacity) {
      showToast({
        type: 'error',
        title: 'Phòng học không đủ sức chứa',
        message: `Khóa học đang có ${activeStudentCount} học viên, vượt sức chứa ${selectedRoom.capacity} của ${selectedRoom.name}.`,
      })
      return
    }

    const wantsSchedule = Boolean(form.roomId || form.startDate)
    const canPlan = Boolean(
      form.teacherId &&
        form.roomId &&
        form.startDate &&
        form.startTime &&
        form.endTime,
    )

    if (wantsSchedule && !canPlan) {
      showToast({
        type: 'error',
        title: 'Thông tin lịch học chưa đầy đủ',
        message:
          'Để lên lịch, hãy chọn giảng viên, phòng, ngày khai giảng và giờ học.',
      })
      return
    }

    if (canPlan && form.startTime >= form.endTime) {
      showToast({
        type: 'error',
        title: 'Khung giờ không hợp lệ',
        message: 'Giờ kết thúc phải sau giờ bắt đầu.',
      })
      return
    }

    const proposedSessions = canPlan
      ? generateSessions(course?.id ?? 'new-course', form)
      : []
    const conflict = findScheduleConflict(
      proposedSessions,
      sessions,
      courses,
      enrollments,
      students,
      course?.id,
      teachers,
      rooms,
    )

    if (conflict) {
      showToast({
        type: 'error',
        title: 'Không thể lên lịch do tranh chấp',
        message: conflict,
      })
      return
    }

    setIsSaving(true)
    try {
      const lastSession = proposedSessions.at(-1)
      const payload: Course = {
        id: course?.id ?? '',
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        teacherId: form.teacherId || null,
        roomId: canPlan ? form.roomId : null,
        startDate: canPlan ? form.startDate : null,
        endDate: lastSession?.date ?? null,
        schedulePattern: canPlan ? form.schedulePattern : null,
        startTime: canPlan ? form.startTime : null,
        endTime: canPlan ? form.endTime : null,
        sessionCount: Number(form.sessionCount),
        status: statusFromForm(form),
        createdAt: course?.createdAt ?? getToday(),
      }

      let savedCourse: Course
      if (course) {
        savedCourse = await api.update('courses', payload)
        const oldSessions = sessions.filter((item) => item.courseId === course.id)
        await Promise.all(oldSessions.map((item) => api.remove('sessions', item.id)))
      } else {
        const { id: _, ...newCourse } = payload
        savedCourse = await api.create<Course>('courses', newCourse)
      }

      if (canPlan) {
        await Promise.all(
          proposedSessions.map((item) =>
            api.create<ClassSession>('sessions', {
              ...item,
              courseId: savedCourse.id,
            }),
          ),
        )
      }

      await loadAll()
      showToast({
        type: 'success',
        title: course ? 'Đã cập nhật khóa học' : 'Đã tạo khóa học',
        message: canPlan
          ? `Đã tạo ${proposedSessions.length} buổi học và không phát hiện tranh chấp.`
          : 'Khóa học đã được lưu thành công.',
      })
      onClose()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể lưu khóa học',
        message:
          error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={course ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
      description="Có thể lưu khóa trước, sau đó gán giảng viên và lên lịch khi đã sẵn sàng."
      size="xl"
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Tên khóa học *
            <input
              required
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              className={inputClass}
              placeholder="Ví dụ: React nâng cao"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Mã khóa học *
            <input
              required
              value={form.code}
              onChange={(event) => update('code', event.target.value)}
              className={inputClass}
              placeholder="REACT-2605"
            />
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-600">
          Mô tả
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Mục tiêu và nội dung chính của khóa học"
          />
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h3 className="text-sm font-bold text-slate-800">Phân công giảng dạy</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Giảng viên phụ trách
              <select
                value={form.teacherId}
                onChange={(event) => update('teacherId', event.target.value)}
                className={inputClass}
              >
                <option value="">Chưa gán giảng viên</option>
                {teachers
                  .filter((item) => item.status === 'active')
                  .map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} · {teacher.specialty}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Phòng học
              <select
                value={form.roomId}
                onChange={(event) => update('roomId', event.target.value)}
                className={inputClass}
              >
                <option value="">Chưa chọn phòng</option>
                {rooms
                  .filter((item) => item.status === 'active')
                  .map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} · {room.capacity} chỗ
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="text-sm font-bold text-slate-800">Lên lịch các buổi học</h3>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Hệ thống tự sinh từng buổi và kiểm tra trùng giảng viên, phòng học,
            lịch học viên trước khi lưu.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold text-slate-600">
              Ngày khai giảng
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => update('startDate', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Lịch trong tuần
              <select
                value={form.schedulePattern}
                onChange={(event) =>
                  update('schedulePattern', event.target.value as SchedulePattern)
                }
                className={inputClass}
              >
                <option value="2-4-6">Thứ 2 - 4 - 6</option>
                <option value="3-5-7">Thứ 3 - 5 - 7</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Giờ bắt đầu
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => update('startTime', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Giờ kết thúc
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => update('endTime', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Số buổi
              <input
                type="number"
                min={1}
                max={60}
                value={form.sessionCount}
                onChange={(event) =>
                  update('sessionCount', Number(event.target.value))
                }
                className={inputClass}
              />
            </label>
          </div>
          {preview.length > 0 && (
            <p className="mt-4 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-indigo-700">
              Xem trước: {preview.length} buổi, từ {preview[0].date} đến{' '}
              {preview.at(-1)?.date}.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
          >
            Hủy
          </button>
          <button
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-200 disabled:cursor-wait disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu khóa học'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
