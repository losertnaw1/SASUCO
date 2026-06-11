import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StudentForm } from './StudentForm'

const mocks = vi.hoisted(() => ({
  apiCreate: vi.fn(),
  apiUpdate: vi.fn(),
  loadAll: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('../../lib/api', () => ({
  api: {
    create: mocks.apiCreate,
    update: mocks.apiUpdate,
  },
}))

vi.mock('../../store/useDataStore', () => ({
  useDataStore: (
    selector: (state: { loadAll: typeof mocks.loadAll }) => unknown,
  ) => selector({ loadAll: mocks.loadAll }),
}))

vi.mock('../../store/useToastStore', () => ({
  useToastStore: (
    selector: (state: { showToast: typeof mocks.showToast }) => unknown,
  ) => selector({ showToast: mocks.showToast }),
}))

afterEach(cleanup)

describe('StudentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiCreate.mockResolvedValue({ id: 'student-new' })
  })

  it('tạo học viên, tải lại dữ liệu và báo thành công', async () => {
    const onClose = vi.fn()
    render(<StudentForm open onClose={onClose} />)

    fireEvent.change(screen.getByLabelText(/Họ và tên/), {
      target: { value: 'Nguyễn Hoàng Yến' },
    })
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'yen@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Số điện thoại/), {
      target: { value: '0900000001' },
    })
    fireEvent.change(screen.getByLabelText('Ngày tham gia'), {
      target: { value: '2026-06-11' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Lưu học viên' }).closest('form')!,
    )

    await waitFor(() => {
      expect(mocks.apiCreate).toHaveBeenCalledOnce()
    })

    expect(mocks.apiCreate).toHaveBeenCalledWith('students', {
      name: 'Nguyễn Hoàng Yến',
      email: 'yen@example.com',
      phone: '0900000001',
      joinedAt: '2026-06-11',
      status: 'active',
    })
    expect(mocks.apiUpdate).not.toHaveBeenCalled()
    expect(mocks.loadAll).toHaveBeenCalledOnce()
    expect(mocks.showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Đã thêm học viên',
      message: 'Nguyễn Hoàng Yến đã được lưu vào hệ thống.',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
