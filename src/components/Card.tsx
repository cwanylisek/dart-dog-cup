import type { ReactNode } from 'react'

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-3xl bg-surface shadow-card border border-line ${className}`}>{children}</div>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1 first:mt-0">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Row({
  label,
  hint,
  children,
  onClick,
}: {
  label: ReactNode
  hint?: ReactNode
  children?: ReactNode
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-[15px] font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] text-muted">{hint}</div>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </>
  )
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 border-b border-line last:border-b-0'
  return onClick ? (
    <button className={`${cls} active:bg-surface-2`} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-soft text-accent">{icon}</div>}
      <div className="text-lg font-semibold">{title}</div>
      {hint && <div className="mt-1 max-w-xs text-sm text-muted">{hint}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
