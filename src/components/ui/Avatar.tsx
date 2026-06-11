interface AvatarProps {
  initials: string
  size?: 'sm' | 'md'
}

export function Avatar({ initials, size = 'md' }: AvatarProps) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 font-bold text-white shadow-sm ${
        size === 'sm' ? 'h-9 w-9 text-[11px]' : 'h-11 w-11 text-xs'
      }`}
    >
      {initials}
    </span>
  )
}
