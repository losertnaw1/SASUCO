export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .trim()
}

export function matchesSearch(query: string, values: Array<string | null | undefined>) {
  const keyword = normalizeSearchText(query)
  if (!keyword) return true
  return values.some((value) => normalizeSearchText(value ?? '').includes(keyword))
}
