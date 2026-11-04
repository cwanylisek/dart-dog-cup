import { describe, expect, it } from 'vitest'
import type { Fixture } from '../types'
import { computeStandings, generateRoundRobin, possibleResults, validateResult } from './league'

const pair = (f: { home_id: string; away_id: string }) => [f.home_id, f.away_id].sort().join('-')

describe('generateRoundRobin', () => {
  it('makes everyone play everyone once', () => {
    const ids = ['a', 'b', 'c', 'd']
    const fx = generateRoundRobin(ids)
    expect(fx).toHaveLength(6)
    expect(new Set(fx.map(pair)).size).toBe(6)
    expect(Math.max(...fx.map((f) => f.round))).toBe(3)
    for (let r = 1; r <= 3; r++) {
      const inRound = fx.filter((f) => f.round === r).flatMap((f) => [f.home_id, f.away_id])
      expect(new Set(inRound).size).toBe(4)
    }
  })

  it('handles odd counts with byes', () => {
    const fx = generateRoundRobin(['a', 'b', 'c', 'd', 'e'])
    expect(fx).toHaveLength(10)
    expect(new Set(fx.map(pair)).size).toBe(10)
    expect(Math.max(...fx.map((f) => f.round))).toBe(5)
  })

  it('double round swaps home and away', () => {
    const fx = generateRoundRobin(['a', 'b', 'c'], 2)
    expect(fx).toHaveLength(6)
    const first = fx.filter((f) => f.round <= 3)
    const second = fx.filter((f) => f.round > 3)
    for (const f of first) {
      expect(second.some((g) => g.home_id === f.away_id && g.away_id === f.home_id)).toBe(true)
    }
  })
})

const fixture = (id: string, home: string, away: string, lh: number | null, la: number | null): Fixture => ({
  id,
  round: 1,
  home_id: home,
  away_id: away,
  legs_home: lh,
  legs_away: la,
  played_at: null,
  match_id: null,
})

describe('computeStandings', () => {
  const settings = { points_per_leg: 1, match_win_bonus: 0 }

  it('awards one point per leg', () => {
    const rows = computeStandings(['a', 'b'], [fixture('1', 'a', 'b', 2, 1)], settings)
    expect(rows[0]).toMatchObject({ playerId: 'a', points: 2, won: 1, legDiff: 1 })
    expect(rows[1]).toMatchObject({ playerId: 'b', points: 1, lost: 1, legDiff: -1 })
  })

  it('uses matches won as the first tiebreaker', () => {
    // a: 2-0 win + 0-2 loss = 2 pts, 1 win. c: 1-2 + 1-2 = 2 pts, 0 wins.
    const fx = [fixture('1', 'a', 'b', 2, 0), fixture('2', 'a', 'd', 0, 2), fixture('3', 'c', 'b', 1, 2), fixture('4', 'c', 'd', 1, 2)]
    const rows = computeStandings(['c', 'a', 'b', 'd'], fx, settings)
    const a = rows.findIndex((r) => r.playerId === 'a')
    const c = rows.findIndex((r) => r.playerId === 'c')
    expect(a).toBeLessThan(c)
  })

  it('falls back to head-to-head', () => {
    // a and b both 2 pts, 1 win, diff 0. a beat b.
    const fx = [fixture('1', 'a', 'b', 2, 0), fixture('2', 'b', 'c', 2, 0), fixture('3', 'c', 'a', 2, 0)]
    const rows = computeStandings(['c', 'b', 'a'], fx, settings)
    // All three tied on everything; mini-table is also a 3-way tie -> legs for, then input order.
    expect(rows.map((r) => r.playerId)).toEqual(['c', 'b', 'a'])

    const fx2 = [fixture('1', 'a', 'b', 2, 1), fixture('2', 'b', 'c', 2, 1), fixture('3', 'a', 'd', 1, 2)]
    const rows2 = computeStandings(['b', 'a', 'c', 'd'], fx2, settings)
    expect(rows2.map((r) => r.playerId)).toEqual(['a', 'b', 'd', 'c'])
  })

  it('applies match win bonus', () => {
    const rows = computeStandings(['a', 'b'], [fixture('1', 'a', 'b', 2, 1)], { points_per_leg: 1, match_win_bonus: 3 })
    expect(rows[0].points).toBe(5)
  })
})

describe('results', () => {
  it('validates best-of-3', () => {
    expect(validateResult(2, 1, 2)).toBe(true)
    expect(validateResult(0, 2, 2)).toBe(true)
    expect(validateResult(2, 2, 2)).toBe(false)
    expect(validateResult(1, 1, 2)).toBe(false)
    expect(validateResult(3, 0, 2)).toBe(false)
    expect(possibleResults(2)).toEqual([[2, 0], [2, 1], [1, 2], [0, 2]])
  })
})
