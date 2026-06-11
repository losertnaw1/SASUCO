import { useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { findEnrollmentConflict, getToday } from '../../lib/dates'
import { useDataStore } from '../../store/useDataStore'
import { useToastStore } from '../../store/useToastStore'
import type { Enrollment, Student } from '../../types/domain'
import { Modal } from '../shared/Modal'

export function EnrollmentForm({
  student,
  onClose,
}: {
  student: Student | null
  onClose: () => void
}) {
  const { courses, sessions, enrollments, rooms, loadAll } = useDataStore()
  const showToast = useToastStore((state) => state.showToast)
  const [courseId, setCourseId] = useState('')
  const [saving, setSaving] = useState(false)
  const availableCourses = courses.filter(
    (course) =>
      course.status !== 'Created' &&
      course.status !== 'Assigned' &&
      course.roomId &&
      !enrollments.some(
        (item) =>
          item.studentId === student?.id &&
          item.courseId === course.id &&
          item.status !== 'cancelled',
      ),
  )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!student || !courseId) return
    if (student.status === 'inactive') {
      showToast({
        type: 'error',
        title: 'Học viên đang tạm ngừng',
        message: `Hồ sơ ${student.name} đang tạm ngừng nên không thể ghi danh khóa học mới.`,
      })
      return
    }

    const selectedCourse = courses.find((item) => item.id === courseId)
    const selectedRoom = rooms.find((item) => item.id === selectedCourse?.roomId)
    const activeEnrollmentCount = enrollments.filter(
      (item) => item.courseId === courseId && item.status === 'active',
    ).length
    if (selectedRoom && activeEnrollmentCount >= selectedRoom.capacity) {
      showToast({
        type: 'error',
        title: 'Phòng học đã đủ sức chứa',
        message: `Khóa “${selectedCourse?.name}” tại ${selectedRoom.name} đã có ${activeEnrollmentCount}/${selectedRoom.capacity} học viên.`,
      })
      return
    }

    const conflict = findEnrollmentConflict(
      student.id,
      courseId,
      sessions,
      enrollments,
      courses,
      rooms,
    )
    if (conflict) {
      showToast({
        type: 'error',
        title: 'Không thể ghi danh do trùng lịch',
        message: `${student.name}: ${conflict}`,
      })
      return
    }

    setSaving(true)
    try {
      await api.create<Enrollment>('enrollments', {
        studentId: student.id,
        courseId,
        enrolledAt: getToday(),
        status: 'active',
      })
      await loadAll()
      showToast({
        type: 'success',
        title: 'Ghi danh thành công',
        message: `${student.name} đã được thêm vào khóa học.`,
      })
      setCourseId('')
      onClose()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể ghi danh',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={Boolean(student)}
      title={`Ghi danh cho ${student?.name ?? ''}`}
      description="Chỉ các khóa đã lên lịch mới có thể ghi danh. Hệ thống sẽ kiểm tra trùng lịch trước khi lưu."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label className="text-xs font-semibold text-slate-600">
          Chọn khóa học
          <select
            required
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60"
          >
            <option value="">Chọn khóa học phù hợp</option>
            {availableCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} · Thứ {course.schedulePattern?.split('-').join(' - ')} ·{' '}
                {course.startTime}-{course.endTime}
              </option>
            ))}
          </select>
        </label>
        {availableCourses.length === 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
            Học viên đã ghi danh tất cả khóa phù hợp hoặc chưa có khóa nào được
            lên lịch.
          </p>
        )}
        {student?.status === 'inactive' && (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            Hồ sơ học viên đang tạm ngừng. Hãy kích hoạt lại trước khi ghi danh.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
          >
            Hủy
          </button>
          <button
            disabled={
              saving || availableCourses.length === 0 || student?.status === 'inactive'
            }
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Đang ghi danh...' : 'Xác nhận ghi danh'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
