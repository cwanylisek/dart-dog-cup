import { describe, expect, it } from 'vitest'
import { BOT_AVERAGE, BOT_LEVELS, mulberry32, nextDart, type BotLevel } from './bot'
import type { Dart } from './darts'
import { applyDart, average, replay, type MatchConfig } from './x01'

const S1: Dart = { mult: 1, value: 1 }
const SEEDS = [101, 202, 303]

/**
 * Plays a full match where the bot (player 0) faces a dummy that can only score 1.
 * The dummy never finishes, so the bot wins every leg and gets maximum practice.
 */
function simulate(level: BotLevel, seed: number, legs = 50): { avg: number; checkouts: number; darts: number } {
  const rng = mulberry32(seed)
  const config: MatchConfig = {
    startScore: 501,
    legsToWin: legs,
    setsToWin: 1,
    players: [
      { playerId: null, name: 'Bot', bot: level },
      { playerId: null, name: 'Dummy' },
    ],
  }
  const darts: Dart[] = []
  let state = replay(config, darts)
  let guard = 0
  while (state.winner === null && guard++ < 200000) {
    const p = state.currentPlayer
    const dart = config.players[p].bot ? nextDart(level, state.scores[p], 3 - state.currentTurn.length, rng) : S1
    darts.push(dart)
    state = replay(config, darts)
  }
  return { avg: average(state.stats[0]), checkouts: state.stats[0].checkoutsHit, darts: state.stats[0].darts }
}

/** Mean 3-dart average across several seeds, to smooth out run-to-run noise. */
function meanAverage(level: BotLevel): number {
  const runs = SEEDS.map((seed) => simulate(level, seed).avg)
  return runs.reduce((a, b) => a + b, 0) / runs.length
}

describe('bot engine', () => {
  it(
    'keeps every level inside its target average band',
    () => {
      for (const level of BOT_LEVELS) {
        const avg = meanAverage(level)
        const [min, max] = BOT_AVERAGE[level]
        expect(avg, `${level} average`).toBeGreaterThanOrEqual(min)
        expect(avg, `${level} average`).toBeLessThanOrEqual(max)
      }
    },
    20000,
  )

  it('gets harder with each level', () => {
    const averages = BOT_LEVELS.map(meanAverage)
    expect(averages[0]).toBeLessThan(averages[1])
    expect(averages[1]).toBeLessThan(averages[2])
  }, 20000)

  it('can actually finish legs', () => {
    for (const level of BOT_LEVELS) {
      const { checkouts } = simulate(level, 7, 5)
      expect(checkouts, `${level} checkouts`).toBeGreaterThanOrEqual(5)
    }
  })

  it('never produces a busting dart', () => {
    const rng = mulberry32(42)
    for (const level of BOT_LEVELS) {
      for (let score = 2; score <= 501; score++) {
        for (const dartsLeft of [1, 2, 3]) {
          const dart = nextDart(level, score, dartsLeft, rng)
          expect(applyDart(score, dart).bust, `${level} at ${score}`).toBe(false)
        }
      }
    }
  })

  it('is deterministic for a fixed seed', () => {
    const a = simulate('hard', 2024, 3)
    const b = simulate('hard', 2024, 3)
    expect(a).toEqual(b)
  })
})
