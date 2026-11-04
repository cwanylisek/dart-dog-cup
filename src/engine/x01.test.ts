import { describe, expect, it } from 'vitest'
import { MISS, type Dart } from './darts'
import { average, replay, type MatchConfig } from './x01'

const S = (value: number): Dart => ({ mult: 1, value })
const D = (value: number): Dart => ({ mult: 2, value })
const T = (value: number): Dart => ({ mult: 3, value })

const config = (overrides: Partial<MatchConfig> = {}): MatchConfig => ({
  startScore: 501,
  legsToWin: 2,
  setsToWin: 1,
  players: [
    { playerId: 'a', name: 'A' },
    { playerId: 'b', name: 'B' },
  ],
  ...overrides,
})

// 9-darter: T20 x6, T20 T19 D12
const nineDarter: Dart[] = [T(20), T(20), T(20), T(20), T(20), T(20), T(20), T(19), D(12)]

function interleave(a: Dart[], filler: Dart[] = [S(1), S(1), S(1)]): Dart[] {
  const out: Dart[] = []
  for (let i = 0; i < a.length; i += 3) {
    out.push(...a.slice(i, i + 3))
    if (i + 3 < a.length) out.push(...filler)
  }
  return out
}

describe('replay', () => {
  it('tracks scores and turns', () => {
    const s = replay(config(), [T(20), T(20), T(20)])
    expect(s.scores).toEqual([321, 501])
    expect(s.currentPlayer).toBe(1)
    expect(s.currentTurn).toEqual([])
    expect(s.stats[0].max180s).toBe(1)
  })

  it('busts when going below zero, to one, or finishing on a non-double', () => {
    const base = replay(config({ startScore: 41 }), [S(1)])
    expect(base.scores[0]).toBe(40)

    const below = replay(config({ startScore: 40 }), [T(20)])
    expect(below.scores[0]).toBe(40)
    expect(below.currentPlayer).toBe(1)

    const toOne = replay(config({ startScore: 40 }), [S(19), S(20)])
    expect(toOne.scores[0]).toBe(40)

    const single = replay(config({ startScore: 40 }), [S(20), S(20)])
    expect(single.scores[0]).toBe(40)
    expect(single.legs[0].turns[0].bust).toBe(true)
    expect(single.stats[0].points).toBe(0)
  })

  it('wins a leg on a double and rotates the starter', () => {
    const s = replay(config(), interleave(nineDarter))
    expect(s.totalLegsWon).toEqual([1, 0])
    expect(s.legs).toHaveLength(2)
    expect(s.legs[1].starter).toBe(1)
    expect(s.currentPlayer).toBe(1)
    expect(s.stats[0].bestLeg).toBe(9)
    expect(s.stats[0].highestFinish).toBe(141)
    expect(average(s.stats[0])).toBeCloseTo(167)
  })

  it('finishes the match when legs to win is reached', () => {
    const leg1 = interleave(nineDarter)
    // Leg 2: B starts. B throws filler, A throws the nine-darter.
    const leg2: Dart[] = []
    for (let i = 0; i < 9; i += 3) {
      leg2.push(S(1), S(1), S(1))
      leg2.push(...nineDarter.slice(i, i + 3))
    }
    const s = replay(config(), [...leg1, ...leg2])
    expect(s.winner).toBe(0)
    expect(s.totalLegsWon).toEqual([2, 0])
  })

  it('counts checkout attempts', () => {
    const s = replay(config({ startScore: 40 }), [MISS, D(20)])
    expect(s.stats[0].checkoutDarts).toBe(2)
    expect(s.stats[0].checkoutsHit).toBe(1)
  })

  it('handles sets', () => {
    const cfg = config({ startScore: 40, legsToWin: 1, setsToWin: 2 })
    const s1 = replay(cfg, [D(20)])
    expect(s1.setsWon).toEqual([1, 0])
    expect(s1.winner).toBeNull()
    // Set 2 starts with player B.
    expect(s1.currentPlayer).toBe(1)
    const s2 = replay(cfg, [D(20), D(20)])
    expect(s2.setsWon).toEqual([1, 1])
    expect(s2.winner).toBeNull()
    expect(s2.currentPlayer).toBe(0)
    const s3 = replay(cfg, [D(20), D(20), D(20)])
    expect(s3.winner).toBe(0)
  })
})
