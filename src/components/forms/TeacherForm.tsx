import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { useDataStore } from '../../store/useDataStore'
import { useToastStore } from '../../store/useToastStore'
import type { Teacher } from '../../types/domain'
import { Modal } from '../shared/Modal'

interface TeacherFormProps {
  open: boolean
  teacher?: Teacher | null
  onClose: () => void
}

const empty: Omit<Teacher, 'id'> = {
  name: '',
  email: '',
  phone: '',
  specialty: '',
  status: 'active',
}
const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60'

export function TeacherForm({ open, teacher, onClose }: TeacherFormProps) {
  const loadAll = useDataStore((state) => state.loadAll)
  const courses = useDataStore((state) => state.courses) ?? []
  const showToast = useToastStore((state) => state.showToast)
  const [form, setForm] = useState<Omit<Teacher, 'id'>>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(teacher ? { ...teacher } : empty)
  }, [open, teacher])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const assignedCourse = teacher
      ? courses.find(
          (course) =>
            course.teacherId === teacher.id &&
            (course.status === 'Assigned' ||
              course.status === 'Planned' ||
              course.status === 'In-Progress'),
        )
      : undefined
    if (form.status === 'inactive' && assignedCourse) {
      showToast({
        type: 'error',
        title: 'Không thể tạm ngừng giảng viên',
        message: `Giảng viên đang phụ trách khóa “${assignedCourse.name}”. Hãy đổi phân công trước.`,
      })
      return
    }
    setSaving(true)
    try {
      if (teacher) {
        await api.update<Teacher>('teachers', { ...form, id: teacher.id })
      } else {
        await api.create<Teacher>('teachers', form)
      }
      await loadAll()
      showToast({
        type: 'success',
        title: teacher ? 'Đã cập nhật giảng viên' : 'Đã thêm giảng viên',
        message: `${form.name} đã được lưu vào hệ thống.`,
      })
      onClose()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể lưu giảng viên',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={teacher ? 'Chỉnh sửa giảng viên' : 'Thêm giảng viên'}
      description="Thông tin này được dùng khi phân công lịch dạy."
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          Họ và tên *
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Chuyên môn *
          <input
            required
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Email *
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Số điện thoại *
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
          Trạng thái
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as Teacher['status'] })
            }
            className={inputClass}
          >
            <option value="active">Đang làm việc</option>
            <option value="inactive">Tạm nghỉ</option>
          </select>
        </label>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
          >
            Hủy
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Lưu giảng viên'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
