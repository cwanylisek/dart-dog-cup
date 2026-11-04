export const PLAYER_COLORS = [
  '#1a92c9',
  '#7c5cff',
  '#f25f5c',
  '#2fc285',
  '#f5a524',
  '#e05fd2',
  '#14b8a6',
  '#f97316',
  '#64748b',
  '#a3e635',
]

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  const c = color ?? '#64748b'
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `${c}26`,
        color: c,
      }}
    >
      {initials(name)}
    </span>
  )
}
