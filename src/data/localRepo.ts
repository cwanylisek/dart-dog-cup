import type { Snapshot } from '../types'
import { applyOp, emptySnapshot, type OpArgs } from './ops'
import type { Repo, RepoOp } from './repo'

const KEY = 'ddc:local'

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptySnapshot(), ...(JSON.parse(raw) as Snapshot) }
  } catch {
    // ignore corrupt data
  }
  return emptySnapshot()
}

function write(snap: Snapshot) {
  localStorage.setItem(KEY, JSON.stringify(snap))
}

function mutate<K extends RepoOp>(op: K, args: OpArgs[K]) {
  write(applyOp(read(), op, args))
  return Promise.resolve()
}

export const localRepo: Repo = {
  mode: 'local',
  load: () => Promise.resolve(read()),
  verifyPin: () => Promise.resolve(true),
  changePin: () => Promise.resolve(),
  savePlayer: (_pin, player) => mutate('savePlayer', [player]),
  deletePlayer: (_pin, id) => mutate('deletePlayer', [id]),
  saveSettings: (_pin, settings) => mutate('saveSettings', [settings]),
  replaceFixtures: (_pin, fixtures) => mutate('replaceFixtures', [fixtures]),
  setResult: (_pin, id, lh, la, matchId) => mutate('setResult', [id, lh, la, matchId]),
  saveMatch: (_pin, match) => mutate('saveMatch', [match]),
  subscribe: (onChange) => {
    // Keep multiple tabs in sync.
    const handler = (e: StorageEvent) => {
      if (e.key === KEY) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
}
