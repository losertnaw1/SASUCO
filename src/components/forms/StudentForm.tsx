import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { getToday } from '../../lib/dates'
import { useDataStore } from '../../store/useDataStore'
import { useToastStore } from '../../store/useToastStore'
import type { Student } from '../../types/domain'
import { Modal } from '../shared/Modal'

interface StudentFormProps {
  open: boolean
  student?: Student | null
  onClose: () => void
}

const empty: Omit<Student, 'id'> = {
  name: '',
  email: '',
  phone: '',
  joinedAt: getToday(),
  status: 'active',
}
const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60'

export function StudentForm({ open, student, onClose }: StudentFormProps) {
  const loadAll = useDataStore((state) => state.loadAll)
  const enrollments = useDataStore((state) => state.enrollments) ?? []
  const showToast = useToastStore((state) => state.showToast)
  const [form, setForm] = useState<Omit<Student, 'id'>>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(student ? { ...student } : empty)
  }, [open, student])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (student) {
        await api.update<Student>('students', { ...form, id: student.id })
        if (form.status === 'inactive') {
          await Promise.all(
            enrollments
              .filter(
                (item) => item.studentId === student.id && item.status === 'active',
              )
              .map((item) =>
                api.patch('enrollments', item.id, { status: 'paused' }),
              ),
          )
        }
      } else {
        await api.create<Student>('students', form)
      }
      await loadAll()
      showToast({
        type: 'success',
        title: student ? 'Đã cập nhật học viên' : 'Đã thêm học viên',
        message: `${form.name} đã được lưu vào hệ thống.`,
      })
      onClose()
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể lưu học viên',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={student ? 'Chỉnh sửa học viên' : 'Thêm học viên'}
      description="Học viên có thể được ghi danh vào nhiều khóa học không trùng lịch."
      onClose={onClose}
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
          Họ và tên *
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
        <label className="text-xs font-semibold text-slate-600">
          Ngày tham gia
          <input
            type="date"
            value={form.joinedAt}
            onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Trạng thái
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as Student['status'] })
            }
            className={inputClass}
          >
            <option value="active">Đang học</option>
            <option value="inactive">Tạm dừng</option>
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
            {saving ? 'Đang lưu...' : 'Lưu học viên'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
