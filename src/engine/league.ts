import { isPlayed, type Fixture, type LeagueSettings } from '../types'

export interface FixtureDraft {
  round: number
  home_id: string
  away_id: string
}

/** Round-robin schedule using the circle method. Odd player counts get a bye each round. */
export function generateRoundRobin(playerIds: string[], rounds = 1): FixtureDraft[] {
  if (playerIds.length < 2) return []
  const ids: (string | null)[] = [...playerIds]
  if (ids.length % 2 === 1) ids.push(null)
  const n = ids.length
  const perLeg = n - 1
  const result: FixtureDraft[] = []

  let rotation = [...ids]
  for (let r = 0; r < perLeg; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = rotation[i]
      const b = rotation[n - 1 - i]
      if (a === null || b === null) continue
      // Alternate home/away so the fixed player is not always home.
      const flip = i === 0 ? r % 2 === 1 : false
      result.push({ round: r + 1, home_id: flip ? b : a, away_id: flip ? a : b })
    }
    rotation = [rotation[0], rotation[n - 1], ...rotation.slice(1, n - 1)]
  }

  for (let extra = 1; extra < rounds; extra++) {
    const base = result.filter((f) => f.round <= perLeg)
    for (const f of base) {
      const mirrored = extra % 2 === 1
      result.push({
        round: f.round + perLeg * extra,
        home_id: mirrored ? f.away_id : f.home_id,
        away_id: mirrored ? f.home_id : f.away_id,
      })
    }
  }

  return result
}

export interface StandingRow {
  playerId: string
  played: number
  won: number
  lost: number
  legsFor: number
  legsAgainst: number
  legDiff: number
  points: number
}

function emptyRow(playerId: string): StandingRow {
  return { playerId, played: 0, won: 0, lost: 0, legsFor: 0, legsAgainst: 0, legDiff: 0, points: 0 }
}

function tally(
  playerIds: string[],
  fixtures: Fixture[],
  settings: Pick<LeagueSettings, 'points_per_leg' | 'match_win_bonus'>,
): Map<string, StandingRow> {
  const rows = new Map(playerIds.map((id) => [id, emptyRow(id)]))
  for (const f of fixtures) {
    if (!isPlayed(f)) continue
    const home = rows.get(f.home_id)
    const away = rows.get(f.away_id)
    if (!home || !away) continue
    const lh = f.legs_home!
    const la = f.legs_away!
    home.played++
    away.played++
    home.legsFor += lh
    home.legsAgainst += la
    away.legsFor += la
    away.legsAgainst += lh
    home.points += lh * settings.points_per_leg
    away.points += la * settings.points_per_leg
    if (lh > la) {
      home.won++
      away.lost++
      home.points += settings.match_win_bonus
    } else if (la > lh) {
      away.won++
      home.lost++
      away.points += settings.match_win_bonus
    }
  }
  for (const r of rows.values()) r.legDiff = r.legsFor - r.legsAgainst
  return rows
}

/**
 * Order: points, matches won, leg difference, head-to-head (mini table between tied players),
 * then 3-dart average (if provided), then legs won, then name order of the input.
 */
export function computeStandings(
  playerIds: string[],
  fixtures: Fixture[],
  settings: Pick<LeagueSettings, 'points_per_leg' | 'match_win_bonus'>,
  averages: Record<string, number> = {},
): StandingRow[] {
  const rows = tally(playerIds, fixtures, settings)
  const order = new Map(playerIds.map((id, i) => [id, i]))

  const primary = (a: StandingRow, b: StandingRow) =>
    b.points - a.points || b.won - a.won || b.legDiff - a.legDiff

  const sorted = [...rows.values()].sort(primary)

  // Resolve groups that are still tied with a head-to-head mini table.
  const result: StandingRow[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    while (j < sorted.length && primary(sorted[i], sorted[j]) === 0) j++
    const group = sorted.slice(i, j)
    if (group.length > 1) {
      const ids = new Set(group.map((r) => r.playerId))
      const h2hFixtures = fixtures.filter((f) => ids.has(f.home_id) && ids.has(f.away_id))
      const mini = tally([...ids], h2hFixtures, settings)
      group.sort((a, b) => {
        const ma = mini.get(a.playerId)!
        const mb = mini.get(b.playerId)!
        return (
          primary(ma, mb) ||
          (averages[b.playerId] ?? 0) - (averages[a.playerId] ?? 0) ||
          b.legsFor - a.legsFor ||
          order.get(a.playerId)! - order.get(b.playerId)!
        )
      })
    }
    result.push(...group)
    i = j
  }
  return result
}

export function validateResult(legsHome: number, legsAway: number, legsToWin: number): boolean {
  if (!Number.isInteger(legsHome) || !Number.isInteger(legsAway)) return false
  if (legsHome < 0 || legsAway < 0) return false
  const max = Math.max(legsHome, legsAway)
  const min = Math.min(legsHome, legsAway)
  return max === legsToWin && min < legsToWin
}

export function possibleResults(legsToWin: number): [number, number][] {
  const list: [number, number][] = []
  for (let l = 0; l < legsToWin; l++) list.push([legsToWin, l])
  for (let l = legsToWin - 1; l >= 0; l--) list.push([l, legsToWin])
  return list
}
