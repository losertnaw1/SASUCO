import { describe, expect, it } from 'vitest'

import { matchesSearch, normalizeSearchText } from './search'

describe('normalizeSearchText', () => {
  it('chuẩn hóa chữ hoa, dấu tiếng Việt và chữ đ/Đ', () => {
    expect(normalizeSearchText('  ĐẶNG Thị HỒNG  ')).toBe('dang thi hong')
  })
})

describe('matchesSearch', () => {
  it('tìm kiếm không phân biệt hoa thường', () => {
    expect(matchesSearch('lap TRINH', ['Khóa học LẬP trình căn bản'])).toBe(true)
  })

  it('khớp query không dấu với chuỗi có dấu', () => {
    expect(matchesSearch('nguyen thi anh', ['Nguyễn Thị Ánh'])).toBe(true)
  })

  it('xử lý chữ đ và Đ như chữ d', () => {
    expect(matchesSearch('do dang', ['Đỗ Đăng'])).toBe(true)
  })

  it('tìm kiếm trên nhiều field', () => {
    expect(
      matchesSearch('giang vien', [
        'GV-001',
        null,
        undefined,
        'Nguyễn Văn Minh - Giảng viên chính',
      ]),
    ).toBe(true)
    expect(matchesSearch('khong ton tai', ['GV-001', 'Nguyễn Văn Minh'])).toBe(false)
  })

  it('khớp mọi bản ghi khi query rỗng hoặc chỉ có khoảng trắng', () => {
    expect(matchesSearch('', [])).toBe(true)
    expect(matchesSearch('   ', ['Bất kỳ giá trị nào'])).toBe(true)
  })
})
