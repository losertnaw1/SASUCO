import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100/60 sm:max-w-sm">
      <Search size={17} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
      {value && (
        <button
          type="button"
          aria-label="Xóa tìm kiếm"
          onClick={() => onChange('')}
          className="rounded-md p-1 hover:bg-slate-100"
        >
          <X size={14} />
        </button>
      )}
    </label>
  )
}
