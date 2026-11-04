import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NetworkError } from '../data/repo'
import { repo } from '../store/data'
import { usePrefs } from '../store/prefs'
import { useUi } from '../store/ui'
import { Button } from './Button'
import { LockIcon } from './Icons'
import { Sheet } from './Sheet'

export function PinDialog() {
  const { t } = useTranslation()
  const pinRequest = useUi((s) => s.pinRequest)
  const resolvePin = useUi((s) => s.resolvePin)
  const setPin = usePrefs((s) => s.setPin)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (pinRequest) {
      setValue('')
      setError(null)
    }
  }, [pinRequest])

  const submit = async () => {
    if (!value) return
    setBusy(true)
    try {
      const ok = await repo.verifyPin(value)
      if (!ok) {
        setError(t('pin.wrong'))
        return
      }
      setPin(value)
      resolvePin(value)
    } catch (e) {
      setError(e instanceof NetworkError ? t('status.offline') : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={pinRequest !== null} onClose={() => resolvePin(null)}>
      <form
        className="flex flex-col items-center text-center"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <LockIcon />
        </div>
        <div className="text-lg font-bold">{t('pin.title')}</div>
        <div className="mt-1 text-sm text-muted">{t('pin.hint')}</div>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          placeholder={t('pin.placeholder')}
          className={`tabular mt-5 h-14 w-full rounded-2xl border bg-surface-2 text-center text-2xl tracking-[0.5em] outline-none focus:border-accent ${error ? 'border-danger' : 'border-transparent'}`}
        />
        <div className="h-6 pt-1 text-sm text-danger">{error ?? ''}</div>
        <Button type="submit" block size="lg" disabled={busy || !value}>
          {t('pin.unlock')}
        </Button>
      </form>
    </Sheet>
  )
}

export function ConfirmDialog() {
  const { t } = useTranslation()
  const req = useUi((s) => s.confirmRequest)
  const resolve = useUi((s) => s.resolveConfirm)
  return (
    <Sheet open={req !== null} onClose={() => resolve(false)}>
      <div className="pt-2 text-center text-[15px]">{req?.message}</div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => resolve(false)}>
          {t('common.cancel')}
        </Button>
        <Button variant={req?.danger ? 'danger' : 'primary'} onClick={() => resolve(true)}>
          {req?.confirmLabel ?? t('common.confirm')}
        </Button>
      </div>
    </Sheet>
  )
}

export function Toasts() {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            onClick={() => dismiss(toast.id)}
            className={`pointer-events-auto rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur ${
              toast.tone === 'error'
                ? 'bg-danger text-white'
                : toast.tone === 'success'
                  ? 'bg-success text-white'
                  : 'bg-text text-bg'
            }`}
          >
            {toast.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
