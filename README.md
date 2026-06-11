# SASUCO Training Center

SASUCO Training Center là webapp quản lý trung tâm đào tạo, được xây dựng bằng
React, TypeScript, Vite, Tailwind CSS và Zustand. Dữ liệu development được lưu
tạm bằng JSON Server.

## Tổng quan tính năng

- Dashboard hiển thị số liệu vận hành, lịch học hôm nay và cảnh báo giảng viên
  có quá nhiều lịch dạy trong tuần.
- Quản lý khóa học theo luồng trạng thái:
  - `Created`: khóa học mới tạo, chưa gán giảng viên.
  - `Assigned`: đã gán giảng viên, chưa lên lịch.
  - `Planned`: đã chọn phòng và tạo lịch học.
  - `In-Progress`: khóa học đã đến ngày khai giảng.
- Gán giảng viên, chọn phòng, đặt ngày khai giảng và tự động tạo lịch học theo
  Thứ 2-4-6 hoặc Thứ 3-5-7.
- Tự động chặn các tranh chấp:
  - Giảng viên dạy hai lớp cùng thời gian.
  - Phòng học được dùng cho hai lớp cùng thời gian.
  - Học viên đăng ký hai khóa học trùng thời gian.
- Quản lý giảng viên, học viên, phòng học và ghi danh khóa học.
- Tìm kiếm tiếng Việt ngay khi gõ, hỗ trợ tìm không dấu và phân trang.
- Toast tiếng Việt cho thao tác thành công, lỗi và tranh chấp lịch.
- Cài đặt động ngưỡng cảnh báo tải giảng viên và số dòng mỗi trang.

## Công nghệ

- React + TypeScript + Vite
- Tailwind CSS
- Zustand
- JSON Server
- Vitest + Testing Library

## Chạy Development

### 1. Cài dependency

```bash
npm install
```

### 2. Chạy JSON Server

Mở terminal thứ nhất:

```bash
npm run server
```

JSON Server mặc định chạy tại `http://localhost:3001` và sử dụng dữ liệu trong
`db.json`.

### 3. Chạy React Vite

Mở terminal thứ hai:

```bash
npm run dev
```

Truy cập URL được Vite hiển thị trên terminal, mặc định thường là
`http://localhost:5173`.

### Cấu hình API URL

Nếu JSON Server chạy ở địa chỉ khác, tạo file `.env` từ `.env.example`:

```env
VITE_API_URL=http://localhost:3001
```

### Chạy test

```bash
npm test
```
