import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TeacherForm } from './TeacherForm'

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

describe('TeacherForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiCreate.mockResolvedValue({ id: 'teacher-new' })
  })

  it('tạo giảng viên, tải lại dữ liệu và báo thành công', async () => {
    const onClose = vi.fn()
    render(<TeacherForm open onClose={onClose} />)

    fireEvent.change(screen.getByLabelText(/Họ và tên/), {
      target: { value: 'Nguyễn Minh Anh' },
    })
    fireEvent.change(screen.getByLabelText(/Chuyên môn/), {
      target: { value: 'React' },
    })
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'minh.anh@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Số điện thoại/), {
      target: { value: '0900000001' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Lưu giảng viên' }).closest('form')!,
    )

    await waitFor(() => {
      expect(mocks.apiCreate).toHaveBeenCalledOnce()
    })

    expect(mocks.apiCreate).toHaveBeenCalledWith('teachers', {
      name: 'Nguyễn Minh Anh',
      specialty: 'React',
      email: 'minh.anh@example.com',
      phone: '0900000001',
      status: 'active',
    })
    expect(mocks.apiUpdate).not.toHaveBeenCalled()
    expect(mocks.loadAll).toHaveBeenCalledOnce()
    expect(mocks.showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Đã thêm giảng viên',
      message: 'Nguyễn Minh Anh đã được lưu vào hệ thống.',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
