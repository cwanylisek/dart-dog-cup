import { DOUBLES, SINGLES, TREBLES, dartPoints, type Dart } from './darts'

export type Suggestion =
  | { kind: 'checkout'; darts: Dart[] }
  | { kind: 'setup'; darts: Dart[]; leave: number }
  | { kind: 'none' }

interface Route {
  darts: Dart[]
  cost: number
}

/** Each extra dart in a route costs this much, so shorter routes win unless they need a much harder target. */
const DART_WEIGHT = 3
const SETUP_WEIGHT = 0.5
const UNFINISHABLE_LEAVE = 20

/** Lower is easier/preferred. */
function setupCost(d: Dart): number {
  if (d.mult === 1) return d.value === 25 ? 4 : 1
  if (d.mult === 3) {
    if (d.value === 20) return 2.8
    if (d.value === 19) return 2.9
    if (d.value === 18) return 3
    return 3.2
  }
  return 5
}

const FINISH_COST: Record<number, number> = {
  16: 0,
  20: 0.2,
  8: 0.5,
  10: 0.8,
  12: 0.8,
  18: 1,
  4: 1,
  14: 1.5,
  6: 1.5,
  2: 2,
  25: 4,
  1: 4,
}

function finishCost(d: Dart): number {
  return FINISH_COST[d.value] ?? 2.5
}

// Order matters for tie-breaking: earlier entries win ties.
const SETUP_DARTS: Dart[] = [
  ...[...TREBLES].reverse(),
  ...[...SINGLES.filter((d) => d.value !== 25)].reverse(),
  { mult: 1, value: 25 },
  ...[...DOUBLES.filter((d) => d.value !== 25)].reverse(),
  { mult: 2, value: 25 },
]

const FINISHERS = new Map<number, Dart>(DOUBLES.map((d) => [dartPoints(d), d]))

function canonical(setup: Dart[], finish: Dart): Dart[] {
  return [...[...setup].sort((a, b) => dartPoints(b) - dartPoints(a)), finish]
}

function routeCost(setup: Dart[], finish: Dart): number {
  return (setup.length + 1) * DART_WEIGHT + setup.reduce((s, d) => s + setupCost(d), 0) + finishCost(finish)
}

/** best[n][score] = best route using at most n darts. */
const best: (Route | null)[][] = [[], [], [], []]

function buildTable() {
  for (let s = 0; s <= 170; s++) {
    let route: Route | null = null
    const consider = (setup: Dart[], finish: Dart) => {
      const cost = routeCost(setup, finish)
      if (!route || cost < route.cost - 1e-9) route = { darts: canonical(setup, finish), cost }
    }

    const one = FINISHERS.get(s)
    if (one) consider([], one)
    best[1][s] = route

    for (const a of SETUP_DARTS) {
      const f = FINISHERS.get(s - dartPoints(a))
      if (f) consider([a], f)
    }
    best[2][s] = route

    for (const a of SETUP_DARTS) {
      const restA = s - dartPoints(a)
      if (restA < 2) continue
      for (const b of SETUP_DARTS) {
        const f = FINISHERS.get(restA - dartPoints(b))
        if (f) consider([a, b], f)
      }
    }
    best[3][s] = route
  }
}

buildTable()

export function checkoutRoute(score: number, dartsLeft: number): Dart[] | null {
  if (dartsLeft < 1 || score < 2 || score > 170) return null
  return best[Math.min(dartsLeft, 3)][score]?.darts ?? null
}

export function canCheckout(score: number, dartsLeft = 3): boolean {
  return checkoutRoute(score, dartsLeft) !== null
}

function leaveCost(r: number): number {
  if (r < 2) return Infinity
  const route = r <= 170 ? best[3][r] : null
  // Small bias towards lower leaves so equally "nice" finishes prefer scoring more now.
  if (route) return route.cost + r * 0.02
  return UNFINISHABLE_LEAVE + Math.max(0, r - 170) * 0.3
}

const SETUP_CANDIDATES: Dart[] = [...[...TREBLES].reverse(), ...[...SINGLES].reverse(), { mult: 2, value: 25 }]
const T20: Dart = { mult: 3, value: 20 }

function setupRoute(score: number, dartsLeft: number): { darts: Dart[]; leave: number } | null {
  if (score - 60 * dartsLeft > 170) {
    const darts = Array.from({ length: dartsLeft }, () => T20)
    return { darts, leave: score - 60 * dartsLeft }
  }

  let bestDarts: Dart[] | null = null
  let bestCost = Infinity
  const walk = (remaining: number, chosen: Dart[], cost: number) => {
    if (chosen.length === dartsLeft) {
      const total = cost * SETUP_WEIGHT + leaveCost(remaining)
      if (total < bestCost - 1e-9) {
        bestCost = total
        bestDarts = chosen
      }
      return
    }
    for (const d of SETUP_CANDIDATES) {
      const next = remaining - dartPoints(d)
      if (next < 2) continue
      walk(next, [...chosen, d], cost + setupCost(d))
    }
  }
  walk(score, [], 0)

  if (!bestDarts) return null
  const darts = [...(bestDarts as Dart[])].sort((a, b) => dartPoints(b) - dartPoints(a))
  const leave = score - darts.reduce((s, d) => s + dartPoints(d), 0)
  return { darts, leave }
}

export function suggest(score: number, dartsLeft: number): Suggestion {
  if (dartsLeft < 1 || score < 2) return { kind: 'none' }
  const route = checkoutRoute(score, dartsLeft)
  if (route) return { kind: 'checkout', darts: route }
  const setup = setupRoute(score, dartsLeft)
  if (setup) return { kind: 'setup', ...setup }
  return { kind: 'none' }
}
