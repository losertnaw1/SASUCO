import { formatDate } from './dates'
import type {
  ClassSession,
  Course,
  Enrollment,
  Room,
  Student,
  Teacher,
} from '../types/domain'

const enrollmentStatusLabels = {
  active: 'Đang đăng ký',
  paused: 'Tạm ngừng',
  cancelled: 'Đã hủy',
}

function safeFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function writeVietnameseWorkbook(
  sheetName: string,
  filename: string,
  rows: Record<string, unknown>[],
) {
  const headers = Object.keys(rows[0] ?? {})
  const headerCells = headers
    .map(
      (header) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`,
    )
    .join('')
  const dataRows = rows
    .map(
      (row) =>
        `<Row>${headers
          .map(
            (header) =>
              `<Cell><Data ss:Type="String">${escapeXml(row[header])}</Data></Cell>`,
          )
          .join('')}</Row>`,
    )
    .join('')
  const columns = headers
    .map((header) => {
      const width = Math.min(
        280,
        Math.max(
          90,
          header.length * 9,
          ...rows.map((row) => String(row[header] ?? '').length * 8),
        ),
      )
      return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`
    })
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Header"><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#DDEBF7" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName.slice(0, 31))}">
  <Table>${columns}<Row>${headerCells}</Row>${dataRows}</Table>
 </Worksheet>
</Workbook>`
  const blob = new Blob([`\uFEFF${xml}`], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportCourseStudentsReport(
  course: Course,
  students: Student[],
  enrollments: Enrollment[],
) {
  const rows = enrollments
    .filter((item) => item.courseId === course.id)
    .map((enrollment, index) => {
      const student = students.find((item) => item.id === enrollment.studentId)
      return {
        STT: index + 1,
        'Mã học viên': student?.id ?? enrollment.studentId,
        'Họ và tên': student?.name ?? 'Không tìm thấy hồ sơ',
        Email: student?.email ?? '',
        'Số điện thoại': student?.phone ?? '',
        'Trạng thái hồ sơ':
          student?.status === 'active' ? 'Đang học' : 'Tạm ngừng',
        'Trạng thái đăng ký':
          enrollmentStatusLabels[enrollment.status ?? 'active'],
        'Ngày đăng ký': formatDate(enrollment.enrolledAt),
        'Khóa học': course.name,
      }
    })

  await writeVietnameseWorkbook(
    'Danh sách học viên',
    `danh-sach-hoc-vien-${safeFilename(course.code)}.xls`,
    rows.length > 0 ? rows : [{ 'Thông báo': 'Khóa học chưa có học viên đăng ký' }],
  )
}

export async function exportTeacherScheduleReport(
  teacher: Teacher,
  courses: Course[],
  sessions: ClassSession[],
  rooms: Room[],
) {
  const teacherCourses = courses.filter((course) => course.teacherId === teacher.id)
  const rows = teacherCourses
    .flatMap((course) => {
      const courseSessions = sessions
        .filter((session) => session.courseId === course.id)
        .sort((a, b) =>
          `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
        )
      if (courseSessions.length === 0) {
        return [
          {
            'Giảng viên': teacher.name,
            'Mã khóa': course.code,
            'Tên khóa học': course.name,
            'Ngày dạy': 'Chưa lên lịch',
            'Giờ bắt đầu': '',
            'Giờ kết thúc': '',
            'Địa điểm': 'Chưa xếp phòng',
            'Trạng thái khóa': course.status,
          },
        ]
      }
      return courseSessions.map((session) => {
        const room = rooms.find((item) => item.id === session.roomId)
        return {
          'Giảng viên': teacher.name,
          'Mã khóa': course.code,
          'Tên khóa học': course.name,
          'Ngày dạy': formatDate(session.date),
          'Giờ bắt đầu': session.startTime,
          'Giờ kết thúc': session.endTime,
          'Địa điểm': room?.name ?? session.roomId,
          'Trạng thái khóa': course.status,
        }
      })
    })
    .map((row, index) => ({ STT: index + 1, ...row }))

  await writeVietnameseWorkbook(
    'Lịch dạy giảng viên',
    `lich-day-${safeFilename(teacher.name)}.xls`,
    rows.length > 0 ? rows : [{ 'Thông báo': 'Giảng viên chưa có lịch dạy' }],
  )
}
