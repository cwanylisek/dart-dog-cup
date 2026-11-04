import { describe, expect, it } from 'vitest'
import { checkoutRoute, suggest } from './checkout'
import { dartLabel, dartPoints } from './darts'

const labels = (score: number, darts = 3) => checkoutRoute(score, darts)?.map(dartLabel).join(' ') ?? null

describe('checkoutRoute', () => {
  it('finds the classic big finishes', () => {
    expect(labels(170)).toBe('T20 T20 Bull')
    expect(labels(167)).toBe('T20 T19 Bull')
    expect(labels(160)).toBe('T20 T20 D20')
    expect(labels(100)).toBe('T20 D20')
    expect(labels(40)).toBe('D20')
    expect(labels(32)).toBe('D16')
    expect(labels(50, 1)).toBe('Bull')
  })

  it('returns null for bogey numbers and impossible scores', () => {
    for (const s of [169, 168, 166, 165, 163, 162, 159, 171, 1, 0]) {
      expect(checkoutRoute(s, 3)).toBeNull()
    }
  })

  it('respects darts left', () => {
    expect(checkoutRoute(100, 1)).toBeNull()
    expect(labels(100, 2)).toBe('T20 D20')
    expect(checkoutRoute(109, 2)).toBeNull()
    expect(checkoutRoute(41, 1)).toBeNull()
  })

  it('every route adds up and ends on a double', () => {
    for (let darts = 1; darts <= 3; darts++) {
      for (let s = 2; s <= 170; s++) {
        const route = checkoutRoute(s, darts)
        if (!route) continue
        expect(route.length).toBeLessThanOrEqual(darts)
        expect(route.reduce((a, d) => a + dartPoints(d), 0)).toBe(s)
        expect(route[route.length - 1].mult).toBe(2)
      }
    }
  })

  it('every score from 2 to 158 is finishable in three darts', () => {
    for (let s = 2; s <= 158; s++) expect(checkoutRoute(s, 3)).not.toBeNull()
  })

  it('prefers simple single + good double for small odd numbers', () => {
    expect(labels(41)).toBe('S9 D16')
    expect(labels(57)).toBe('S17 D20')
  })
})

describe('suggest', () => {
  it('gives checkouts when possible', () => {
    const s = suggest(80, 3)
    expect(s.kind).toBe('checkout')
  })

  it('sets up a good double with the last dart', () => {
    const s = suggest(45, 1)
    expect(s.kind).toBe('setup')
    if (s.kind === 'setup') expect([32, 40, 36]).toContain(s.leave)
  })

  it('goes for treble 20 when far away', () => {
    const s = suggest(501, 3)
    expect(s.kind).toBe('setup')
    if (s.kind === 'setup') expect(s.darts.map(dartLabel)).toEqual(['T20', 'T20', 'T20'])
  })

  it('never suggests leaving 1 or busting', () => {
    for (let score = 2; score <= 250; score++) {
      for (let d = 1; d <= 3; d++) {
        const s = suggest(score, d)
        if (s.kind === 'setup') expect(s.leave).toBeGreaterThanOrEqual(2)
      }
    }
  })
})
