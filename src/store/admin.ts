import i18n from '../i18n'
import { InvalidPinError, type RepoOp } from '../data/repo'
import type { OpArgs } from '../data/ops'
import { repo, useData } from './data'
import { usePrefs } from './prefs'
import { toast, useUi } from './ui'

/** Returns the admin PIN (asking for it if needed), '' in local mode, or null if the user cancelled. */
export async function requirePin(): Promise<string | null> {
  if (repo.mode === 'local') return ''
  const stored = usePrefs.getState().pin
  if (stored) return stored
  return useUi.getState().askPin()
}

/** Runs a write that needs the admin PIN. Returns true on success. */
export async function adminRun<K extends RepoOp>(op: K, ...args: OpArgs[K]): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const pin = await requirePin()
    if (pin === null) return false
    try {
      await useData.getState().run(pin, op, ...args)
      return true
    } catch (e) {
      if (e instanceof InvalidPinError) {
        toast(i18n.t('pin.wrong'), 'error')
        continue
      }
      console.error(e)
      toast(i18n.t('common.error'), 'error')
      return false
    }
  }
  return false
}
