import { emptyStats, mergeStats, type PlayerStats } from '../engine/x01'
import type { MatchRecord } from '../types'

export interface LifetimeStats {
  matches: number
  wins: number
  stats: PlayerStats
}

export function lifetimeStats(matches: MatchRecord[]): Map<string, LifetimeStats> {
  const map = new Map<string, { matches: number; wins: number; list: PlayerStats[] }>()
  for (const m of matches) {
    m.players.forEach((p, i) => {
      if (!p.player_id || !m.stats?.[i]) return
      const entry = map.get(p.player_id) ?? { matches: 0, wins: 0, list: [] }
      entry.matches++
      if (m.players.length > 1 && m.winner_index === i) entry.wins++
      entry.list.push(m.stats[i])
      map.set(p.player_id, entry)
    })
  }
  const out = new Map<string, LifetimeStats>()
  for (const [id, e] of map) out.set(id, { matches: e.matches, wins: e.wins, stats: mergeStats(e.list) })
  return out
}

export function emptyLifetime(): LifetimeStats {
  return { matches: 0, wins: 0, stats: emptyStats() }
}
