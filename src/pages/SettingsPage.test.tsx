import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Course, Room } from '../types/domain'
import { SettingsPage } from './SettingsPage'

const mocks = vi.hoisted(() => ({
  apiCreate: vi.fn(),
  apiRemove: vi.fn(),
  apiUpdate: vi.fn(),
  loadAll: vi.fn(),
  showToast: vi.fn(),
  useDataStore: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: {
    create: mocks.apiCreate,
    remove: mocks.apiRemove,
    update: mocks.apiUpdate,
  },
}))

vi.mock('../store/useDataStore', () => ({
  useDataStore: mocks.useDataStore,
}))

vi.mock('../store/useToastStore', () => ({
  useToastStore: (
    selector: (state: { showToast: typeof mocks.showToast }) => unknown,
  ) => selector({ showToast: mocks.showToast }),
}))

const room: Room = {
  id: 'room-1',
  name: 'Phòng A1',
  capacity: 30,
  status: 'active',
}

const courseUsingRoom: Course = {
  id: 'course-1',
  name: 'React nâng cao',
  code: 'REACT-01',
  description: '',
  teacherId: 'teacher-1',
  roomId: room.id,
  startDate: '2030-06-03',
  endDate: '2030-06-28',
  schedulePattern: '2-4-6',
  startTime: '08:00',
  endTime: '10:00',
  sessionCount: 12,
  status: 'Planned',
  createdAt: '2030-05-01',
}

function setStoreData(courses: Course[] = []) {
  mocks.useDataStore.mockReturnValue({
    settings: {
      id: 'app',
      teacherWeeklySessionLimit: 6,
      pageSize: 10,
    },
    rooms: [room],
    courses,
    loadAll: mocks.loadAll,
  })
}

function submitSettings() {
  const form = screen.getByRole('button', { name: 'Lưu cài đặt' }).closest('form')

  if (!form) {
    throw new Error('Không tìm thấy form cài đặt')
  }

  fireEvent.submit(form)
}

describe('SettingsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiCreate.mockResolvedValue({ id: 'room-new' })
    mocks.apiRemove.mockResolvedValue({})
    mocks.apiUpdate.mockResolvedValue({
      id: 'app',
      teacherWeeklySessionLimit: 6,
      pageSize: 10,
    })
    mocks.loadAll.mockResolvedValue(undefined)
    setStoreData()
  })

  it('gọi api.update, loadAll và toast success khi lưu cài đặt', async () => {
    render(<SettingsPage />)

    fireEvent.change(screen.getByLabelText(/Cảnh báo giảng viên quá tải từ/), {
      target: { value: '8' },
    })
    fireEvent.change(screen.getByLabelText('Số dòng mỗi trang'), {
      target: { value: '20' },
    })
    submitSettings()

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith({
        type: 'success',
        title: 'Đã lưu cài đặt',
        message: 'Dashboard và các trang quản lý đã áp dụng quy tắc mới.',
      })
    })

    expect(mocks.apiUpdate).toHaveBeenCalledWith('settings', {
      id: 'app',
      teacherWeeklySessionLimit: 8,
      pageSize: 20,
    })
    expect(mocks.loadAll).toHaveBeenCalledOnce()
  })

  it('hiển thị toast error khi lưu cài đặt thất bại', async () => {
    mocks.apiUpdate.mockRejectedValueOnce(new Error('Không kết nối được máy chủ'))
    render(<SettingsPage />)

    submitSettings()

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith({
        type: 'error',
        title: 'Không thể lưu cài đặt',
        message: 'Không kết nối được máy chủ',
      })
    })

    expect(mocks.loadAll).not.toHaveBeenCalled()
  })

  it('thêm phòng qua api.create và hiển thị toast success', async () => {
    render(<SettingsPage />)

    const roomSection = screen.getByText('Danh sách phòng học').closest('section')
    if (!roomSection) {
      throw new Error('Không tìm thấy phần quản lý phòng học')
    }

    fireEvent.change(within(roomSection).getByPlaceholderText('Tên phòng học'), {
      target: { value: '  Phòng B2  ' },
    })
    fireEvent.change(within(roomSection).getByRole('spinbutton'), {
      target: { value: '45' },
    })
    fireEvent.click(within(roomSection).getByRole('button', { name: 'Thêm phòng' }))

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith({
        type: 'success',
        title: 'Đã thêm phòng học',
      })
    })

    expect(mocks.apiCreate).toHaveBeenCalledWith('rooms', {
      name: 'Phòng B2',
      capacity: 45,
      status: 'active',
    })
    expect(mocks.loadAll).toHaveBeenCalledOnce()
  })

  it('chặn xóa phòng đang được khóa học sử dụng', () => {
    setStoreData([courseUsingRoom])
    render(<SettingsPage />)

    const roomRow = screen.getByText(room.name).parentElement?.parentElement
    const removeButton = roomRow?.querySelector('button')
    if (!removeButton) {
      throw new Error('Không tìm thấy nút xóa phòng học')
    }

    fireEvent.click(removeButton)

    expect(mocks.showToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'Không thể xóa phòng học',
      message: 'Phòng đang được dùng bởi khóa “React nâng cao”.',
    })
    expect(mocks.apiRemove).not.toHaveBeenCalled()
    expect(mocks.loadAll).not.toHaveBeenCalled()
  })
})
