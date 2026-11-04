import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-[0_6px_20px_-6px_var(--accent)] active:bg-accent-strong',
  secondary: 'bg-surface-2 text-text active:bg-surface-3',
  ghost: 'bg-transparent text-text active:bg-surface-2',
  danger: 'bg-danger/10 text-danger active:bg-danger/20',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-full',
  md: 'h-11 px-5 text-[15px] rounded-full',
  lg: 'h-14 px-6 text-base rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; block?: boolean; children: ReactNode }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-[transform,background-color,opacity] duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({
  className = '',
  children,
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-text transition-colors active:bg-surface-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
