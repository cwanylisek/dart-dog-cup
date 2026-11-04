import { checkoutRoute } from './checkout'
import { MISS, type Dart } from './darts'
import { applyDart } from './x01'

export type BotLevel = 'easy' | 'medium' | 'hard'

export const BOT_LEVELS: readonly BotLevel[] = ['easy', 'medium', 'hard']

/** Target 3-dart average band for each level (inclusive bounds used by tests). */
export const BOT_AVERAGE: Record<BotLevel, [number, number]> = {
  easy: [30, 40],
  medium: [40, 45],
  hard: [50, 60],
}

interface Profile {
  /** Aiming at T20: probability of hitting the treble. */
  treble: number
  /** Aiming at T20: probability of landing in the single 20 after a miss. */
  single20: number
  /** Aiming at T20: probability of drifting into a neighbouring single (before the total-miss chance). */
  neighbour: number
  /** Probability of hitting an aimed single (a route set-up dart). */
  single: number
  /** Probability of hitting an aimed double (the finishing dart). */
  double: number
}

const PROFILES: Record<BotLevel, Profile> = {
  easy: { treble: 0.08, single20: 0.46, neighbour: 0.15, single: 0.55, double: 0.1 },
  medium: { treble: 0.11, single20: 0.45, neighbour: 0.12, single: 0.68, double: 0.22 },
  hard: { treble: 0.18, single20: 0.42, neighbour: 0.1, single: 0.8, double: 0.33 },
}

const T20: Dart = { mult: 3, value: 20 }

/** A missed aimed single drifts to a neighbouring single, or falls out of the board. */
function driftSingle(target: Dart, rng: () => number): Dart {
  const v = target.value
  if (v === 25) return rng() < 0.5 ? { mult: 1, value: 25 } : MISS
  const r = rng()
  if (r < 0.4) return { mult: 1, value: v === 20 ? 5 : v + 1 }
  if (r < 0.7) return { mult: 1, value: v <= 1 ? 20 : v - 1 }
  return MISS
}

/** Pick the bot's next dart given the current score and darts left in the turn. */
export function nextDart(level: BotLevel, score: number, dartsLeft: number, rng: () => number = Math.random): Dart {
  const p = PROFILES[level]
  const target = checkoutRoute(score, dartsLeft)?.[0] ?? T20

  let dart: Dart
  if (target.mult === 2) {
    // Finishing double: hit it, else often drop into the single of the same number.
    if (rng() < p.double) dart = target
    else dart = rng() < 0.6 ? { mult: 1, value: target.value } : MISS
  } else if (target.mult === 1) {
    // Route set-up single.
    dart = rng() < p.single ? target : driftSingle(target, rng)
  } else {
    // Scoring at the treble 20.
    const r = rng()
    if (r < p.treble) dart = target
    else if (r < p.treble + p.single20) dart = { mult: 1, value: 20 }
    else if (r < p.treble + p.single20 + p.neighbour) dart = rng() < 0.5 ? { mult: 1, value: 5 } : { mult: 1, value: 1 }
    else dart = MISS
  }

  // Never bust: a misplaced dart that would bust counts as a miss.
  return applyDart(score, dart).bust ? MISS : dart
}

/** Small deterministic PRNG (32-bit) so bot simulations are reproducible in tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
