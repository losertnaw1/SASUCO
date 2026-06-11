const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Máy chủ trả về lỗi ${response.status}. Vui lòng thử lại.`)
  }

  return response.json() as Promise<T>
}

export const api = {
  list: <T>(resource: string) => request<T[]>(`/${resource}`),
  create: <T>(resource: string, data: Omit<T, 'id'> | T) =>
    request<T>(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: <T extends { id: string }>(resource: string, data: T) =>
    request<T>(`/${resource}/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  patch: <T>(resource: string, id: string, data: Partial<T>) =>
    request<T>(`/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (resource: string, id: string) =>
    request<Record<string, never>>(`/${resource}/${id}`, { method: 'DELETE' }),
}
