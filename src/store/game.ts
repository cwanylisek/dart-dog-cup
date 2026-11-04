import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dart } from '../engine/darts'
import { replay, type MatchConfig, type MatchState } from '../engine/x01'
import { uid } from '../lib/id'
import type { MatchRecord } from '../types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'needs-pin' | 'skipped' | 'error'

interface GameState {
  config: MatchConfig | null
  darts: Dart[]
  fixtureId: string | null
  matchId: string | null
  startedAt: string | null
  saveState: SaveState
  start: (config: MatchConfig, fixtureId?: string | null) => void
  throwDart: (dart: Dart) => void
  undo: () => void
  quit: () => void
  rematch: () => void
  setSaveState: (s: SaveState) => void
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      config: null,
      darts: [],
      fixtureId: null,
      matchId: null,
      startedAt: null,
      saveState: 'idle',

      start: (config, fixtureId = null) =>
        set({ config, darts: [], fixtureId, matchId: uid(), startedAt: new Date().toISOString(), saveState: 'idle' }),

      throwDart: (dart) => {
        const { config, darts } = get()
        if (!config) return
        if (replay(config, darts).winner !== null) return
        set({ darts: [...darts, dart] })
      },

      undo: () => {
        const { darts, saveState } = get()
        // Once a finished match has been saved, it can't be reopened.
        if (!darts.length || saveState === 'saved' || saveState === 'saving') return
        set({ darts: darts.slice(0, -1), saveState: 'idle' })
      },

      quit: () => set({ config: null, darts: [], fixtureId: null, matchId: null, startedAt: null, saveState: 'idle' }),

      rematch: () => {
        const { config } = get()
        if (!config) return
        // Loser of the previous match throws first.
        const players = [...config.players].reverse()
        set({ config: { ...config, players }, darts: [], fixtureId: null, matchId: uid(), startedAt: new Date().toISOString(), saveState: 'idle' })
      },

      setSaveState: (saveState) => set({ saveState }),
    }),
    {
      name: 'ddc:game',
      partialize: (s) => ({
        config: s.config,
        darts: s.darts,
        fixtureId: s.fixtureId,
        matchId: s.matchId,
        startedAt: s.startedAt,
        saveState: s.saveState === 'saving' ? 'idle' : s.saveState,
      }),
    },
  ),
)

export function toMatchRecord(state: MatchState, id: string, fixtureId: string | null): MatchRecord {
  return {
    id,
    created_at: new Date().toISOString(),
    fixture_id: fixtureId,
    start_score: state.config.startScore,
    legs_to_win: state.config.legsToWin,
    sets_to_win: state.config.setsToWin,
    players: state.config.players.map((p) => ({ player_id: p.playerId, name: p.name })),
    winner_index: state.winner,
    legs_won: state.totalLegsWon,
    sets_won: state.setsWon,
    stats: state.stats,
  }
}
