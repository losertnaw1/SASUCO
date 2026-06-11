import { DoorOpen, Plus, Save, Settings2, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { PageIntro } from '../components/shared/PageIntro'
import { api } from '../lib/api'
import { useDataStore } from '../store/useDataStore'
import { useToastStore } from '../store/useToastStore'
import type { AppSettings } from '../types/domain'

export function SettingsPage() {
  const { settings, rooms, courses, loadAll } = useDataStore()
  const showToast = useToastStore((state) => state.showToast)
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomCapacity, setRoomCapacity] = useState(30)

  useEffect(() => setForm(settings), [settings])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await api.update<AppSettings>('settings', form)
      await loadAll()
      showToast({
        type: 'success',
        title: 'Đã lưu cài đặt',
        message: 'Dashboard và các trang quản lý đã áp dụng quy tắc mới.',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể lưu cài đặt',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    } finally {
      setSaving(false)
    }
  }

  const addRoom = async () => {
    if (!roomName.trim()) {
      showToast({ type: 'error', title: 'Vui lòng nhập tên phòng học' })
      return
    }
    try {
      await api.create('rooms', {
        name: roomName.trim(),
        capacity: roomCapacity,
        status: 'active',
      })
      await loadAll()
      setRoomName('')
      showToast({ type: 'success', title: 'Đã thêm phòng học' })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể thêm phòng học',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    }
  }

  const removeRoom = async (id: string, name: string) => {
    const usedBy = courses.find((course) => course.roomId === id)
    if (usedBy) {
      showToast({
        type: 'error',
        title: 'Không thể xóa phòng học',
        message: `Phòng đang được dùng bởi khóa “${usedBy.name}”.`,
      })
      return
    }
    if (!window.confirm(`Xóa phòng “${name}”?`)) return
    try {
      await api.remove('rooms', id)
      await loadAll()
      showToast({ type: 'success', title: 'Đã xóa phòng học' })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Không thể xóa phòng học',
        message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageIntro
        eyebrow="Hệ thống"
        title="Cài đặt vận hành"
        description="Điều chỉnh ngưỡng cảnh báo tải giảng viên và số dòng hiển thị trên các trang quản lý."
        icon={Settings2}
      />
      <form
        onSubmit={submit}
        className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <SlidersHorizontal size={19} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Quy tắc chung</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Các giá trị được lưu trực tiếp vào JSON Server.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Cảnh báo giảng viên quá tải từ
            <div className="mt-1.5 flex items-center rounded-xl border border-slate-200 px-3">
              <input
                type="number"
                min={1}
                max={30}
                value={form.teacherWeeklySessionLimit}
                onChange={(event) =>
                  setForm({
                    ...form,
                    teacherWeeklySessionLimit: Number(event.target.value),
                  })
                }
                className="min-w-0 flex-1 py-2.5 text-sm outline-none"
              />
              <span className="text-[11px] text-slate-400">buổi/tuần</span>
            </div>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Số dòng mỗi trang
            <select
              value={form.pageSize}
              onChange={(event) =>
                setForm({ ...form, pageSize: Number(event.target.value) })
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            >
              <option value={5}>5 dòng</option>
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
            </select>
          </label>
        </div>
        <button
          disabled={saving}
          className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-200 disabled:opacity-60"
        >
          <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </form>

      <section className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <DoorOpen size={19} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Danh sách phòng học</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Phòng đang có khóa sử dụng sẽ không thể xóa.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Tên phòng học"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300"
          />
          <input
            type="number"
            min={1}
            value={roomCapacity}
            onChange={(event) => setRoomCapacity(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none sm:w-28"
          />
          <button
            type="button"
            onClick={addRoom}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            <Plus size={14} /> Thêm phòng
          </button>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-xs font-bold text-slate-700">{room.name}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Sức chứa {room.capacity} học viên
                </p>
              </div>
              <button
                onClick={() => removeRoom(room.id, room.name)}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
