import { motion } from 'motion/react'

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={`relative flex rounded-full bg-surface-2 p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`relative z-10 flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${active ? 'text-text' : 'text-muted'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join('-')}`}
                className="absolute inset-0 -z-10 rounded-full bg-surface shadow-card dark:bg-surface-3"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  format,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
      <button
        className="h-8 w-8 rounded-full text-lg font-semibold active:bg-surface-3 disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="-"
      >
        −
      </button>
      <span className="tabular min-w-10 text-center text-[15px] font-semibold">{format ? format(value) : value}</span>
      <button
        className="h-8 w-8 rounded-full text-lg font-semibold active:bg-surface-3 disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="+"
      >
        +
      </button>
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface-3'}`}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
      />
    </button>
  )
}
