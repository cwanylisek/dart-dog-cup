import { create } from 'zustand'
import i18n from '../i18n'
import { localRepo } from '../data/localRepo'
import { applyOp, emptySnapshot, type OpArgs } from '../data/ops'
import { createRemoteRepo } from '../data/remoteRepo'
import { InvalidPinError, NetworkError, type Repo, type RepoOp } from '../data/repo'
import { uid } from '../lib/id'
import { supabase } from '../lib/supabase'
import type { Snapshot } from '../types'
import { usePrefs } from './prefs'
import { toast } from './ui'

const CACHE_KEY = 'ddc:cache'
const QUEUE_KEY = 'ddc:queue'

export const repo: Repo = supabase ? createRemoteRepo(supabase) : localRepo

interface PendingOp {
  id: string
  op: RepoOp
  pin: string
  args: unknown[]
}

interface DataState {
  ready: boolean
  online: boolean
  syncing: boolean
  snapshot: Snapshot
  pending: PendingOp[]
  init: () => () => void
  refresh: () => Promise<void>
  run: <K extends RepoOp>(pin: string, op: K, ...args: OpArgs[K]) => Promise<void>
  flush: () => Promise<void>
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function invoke(op: RepoOp, pin: string, args: unknown[]): Promise<void> {
  const fn = repo[op] as (pin: string, ...a: unknown[]) => Promise<void>
  return fn(pin, ...args)
}

export const useData = create<DataState>()((set, get) => {
  const setSnapshot = (snapshot: Snapshot) => {
    set({ snapshot })
    if (repo.mode === 'remote') localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot))
  }

  const setPending = (pending: PendingOp[]) => {
    set({ pending })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(pending))
  }

  const reapplyPending = (snapshot: Snapshot) =>
    get().pending.reduce((s, p) => applyOp(s, p.op, p.args as never), snapshot)

  return {
    ready: false,
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    syncing: false,
    snapshot: repo.mode === 'remote' ? { ...emptySnapshot(), ...readJson(CACHE_KEY, emptySnapshot()) } : emptySnapshot(),
    pending: readJson<PendingOp[]>(QUEUE_KEY, []),

    init: () => {
      void get()
        .refresh()
        .finally(() => {
          set({ ready: true })
          void get().flush()
        })

      const unsubscribe = repo.subscribe(() => void get().refresh())
      const goOnline = () => {
        set({ online: true })
        void get().flush().then(() => get().refresh())
      }
      const goOffline = () => set({ online: false })
      window.addEventListener('online', goOnline)
      window.addEventListener('offline', goOffline)
      return () => {
        unsubscribe()
        window.removeEventListener('online', goOnline)
        window.removeEventListener('offline', goOffline)
      }
    },

    refresh: async () => {
      try {
        const snapshot = await repo.load()
        setSnapshot(reapplyPending(snapshot))
        set({ online: true })
      } catch (e) {
        if (e instanceof NetworkError) set({ online: false })
        else console.error(e)
      }
    },

    run: async (pin, op, ...args) => {
      setSnapshot(applyOp(get().snapshot, op, args))
      try {
        await invoke(op, pin, args)
      } catch (e) {
        if (e instanceof NetworkError) {
          setPending([...get().pending, { id: uid(), op, pin, args }])
          set({ online: false })
          return
        }
        if (e instanceof InvalidPinError) usePrefs.getState().setPin(null)
        await get().refresh()
        throw e
      }
    },

    flush: async () => {
      if (get().syncing || get().pending.length === 0 || repo.mode === 'local') return
      set({ syncing: true })
      try {
        while (get().pending.length) {
          const next = get().pending[0]
          try {
            await invoke(next.op, next.pin, next.args)
          } catch (e) {
            if (e instanceof NetworkError) {
              set({ online: false })
              return
            }
            toast(e instanceof InvalidPinError ? i18n.t('pin.wrong') : i18n.t('common.error'), 'error')
          }
          setPending(get().pending.filter((p) => p.id !== next.id))
        }
        set({ online: true })
      } finally {
        set({ syncing: false })
      }
    },
  }
})
