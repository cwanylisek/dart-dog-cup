export type Multiplier = 0 | 1 | 2 | 3

/** value: 1-20, 25 for bull (mult 1 = outer bull 25, mult 2 = bullseye 50), 0 for a miss. */
export interface Dart {
  mult: Multiplier
  value: number
}

export const MISS: Dart = { mult: 0, value: 0 }

export function dartPoints(d: Dart): number {
  return d.mult * d.value
}

export function isDouble(d: Dart): boolean {
  return d.mult === 2
}

export function dartLabel(d: Dart): string {
  if (d.mult === 0 || d.value === 0) return 'Miss'
  if (d.value === 25) return d.mult === 2 ? 'Bull' : '25'
  const prefix = d.mult === 3 ? 'T' : d.mult === 2 ? 'D' : 'S'
  return `${prefix}${d.value}`
}

export function sameDart(a: Dart, b: Dart): boolean {
  return a.mult === b.mult && a.value === b.value
}

const numbers = Array.from({ length: 20 }, (_, i) => i + 1)

export const SINGLES: Dart[] = [...numbers.map((value) => ({ mult: 1 as const, value })), { mult: 1, value: 25 }]
export const DOUBLES: Dart[] = [...numbers.map((value) => ({ mult: 2 as const, value })), { mult: 2, value: 25 }]
export const TREBLES: Dart[] = numbers.map((value) => ({ mult: 3 as const, value }))
export const ALL_SCORING: Dart[] = [...SINGLES, ...DOUBLES, ...TREBLES]
