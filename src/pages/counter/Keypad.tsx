import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Dart, Multiplier } from '../../engine/darts'
import { UndoIcon } from '../../components/Icons'

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1)

function vibrate(ms = 8) {
  navigator.vibrate?.(ms)
}

export function Keypad({
  onDart,
  onUndo,
  canUndo,
  hint,
  disabled,
}: {
  onDart: (d: Dart) => void
  onUndo: () => void
  canUndo: boolean
  hint: Dart | null
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const [mult, setMult] = useState<Multiplier>(1)

  const throwDart = (value: number) => {
    vibrate()
    if (value === 0) onDart({ mult: 0, value: 0 })
    else if (value === 25) onDart({ mult: mult === 2 ? 2 : 1, value: 25 })
    else onDart({ mult, value })
    setMult(1)
  }

  const toggle = (m: Multiplier) => {
    vibrate(5)
    setMult((cur) => (cur === m ? 1 : m))
  }

  const hinted = (value: number, m?: Multiplier) =>
    hint !== null && hint.value === value && (m === undefined || hint.mult === m)

  const modBtn = (m: Multiplier, label: string, activeCls: string) => (
    <button
      onClick={() => toggle(m)}
      disabled={disabled}
      className={`relative h-12 flex-1 rounded-2xl text-[15px] font-bold transition-colors ${
        mult === m ? activeCls : 'bg-surface-2 text-text active:bg-surface-3'
      }`}
    >
      {label}
      {hint && hint.value !== 25 && hint.mult === m && m !== 1 && mult !== m && (
        <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
      )}
    </button>
  )

  const numberClass = (value: number) => {
    const isHint = hinted(value)
    return `tabular relative rounded-2xl text-xl font-bold transition-all active:scale-95 disabled:opacity-40 ${
      mult === 3
        ? 'bg-accent/15 text-accent active:bg-accent/25'
        : mult === 2
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 active:bg-emerald-500/25'
          : 'bg-surface text-text border border-line active:bg-surface-2'
    } ${isHint ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex gap-2">
        {modBtn(2, t('counter.double'), 'bg-emerald-500 text-white')}
        {modBtn(3, t('counter.treble'), 'bg-accent text-white')}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-4 gap-2">
        {NUMBERS.map((n) => (
          <button key={n} disabled={disabled} onClick={() => throwDart(n)} className={numberClass(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="grid h-14 shrink-0 grid-cols-4 gap-2">
        <button
          disabled={disabled || mult === 3}
          onClick={() => throwDart(25)}
          className={`rounded-2xl border border-line bg-surface text-base font-bold active:bg-surface-2 disabled:opacity-40 ${hinted(25, 1) ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`}
        >
          25
        </button>
        <button
          disabled={disabled || mult === 3}
          onClick={() => {
            vibrate()
            onDart({ mult: 2, value: 25 })
            setMult(1)
          }}
          className={`rounded-2xl bg-danger/12 text-base font-bold text-danger active:bg-danger/20 disabled:opacity-40 ${hinted(25, 2) ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`}
        >
          {t('counter.bull')}
        </button>
        <button
          disabled={disabled}
          onClick={() => throwDart(0)}
          className="rounded-2xl bg-surface-2 text-base font-bold text-muted active:bg-surface-3"
        >
          {t('counter.miss')}
        </button>
        <button
          disabled={!canUndo}
          onClick={() => {
            vibrate()
            setMult(1)
            onUndo()
          }}
          aria-label={t('counter.undo')}
          className="flex items-center justify-center rounded-2xl bg-surface-2 text-text active:bg-surface-3 disabled:opacity-40"
        >
          <UndoIcon />
        </button>
      </div>
    </div>
  )
}
