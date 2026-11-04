import type { BotLevel } from './bot'
import { dartPoints, isDouble, type Dart } from './darts'

export interface MatchPlayer {
  playerId: string | null
  name: string
  /** Set when this slot is played by the bot engine. */
  bot?: BotLevel
}

export interface MatchConfig {
  startScore: number
  legsToWin: number
  /** 1 means sets are off: the first player to win `legsToWin` legs wins the match. */
  setsToWin: number
  players: MatchPlayer[]
}

export interface Turn {
  player: number
  darts: Dart[]
  startScore: number
  points: number
  bust: boolean
  checkout: boolean
}

export interface Leg {
  set: number
  starter: number
  turns: Turn[]
  winner: number | null
}

export interface PlayerStats {
  darts: number
  points: number
  first9Darts: number
  first9Points: number
  checkoutDarts: number
  checkoutsHit: number
  tons: number
  ton40s: number
  max180s: number
  highestFinish: number
  bestLeg: number | null
  legsWon: number
  setsWon: number
}

export interface MatchState {
  config: MatchConfig
  legs: Leg[]
  scores: number[]
  currentPlayer: number
  currentTurn: Dart[]
  legsInSet: number[]
  setsWon: number[]
  totalLegsWon: number[]
  winner: number | null
  stats: PlayerStats[]
}

export function emptyStats(): PlayerStats {
  return {
    darts: 0,
    points: 0,
    first9Darts: 0,
    first9Points: 0,
    checkoutDarts: 0,
    checkoutsHit: 0,
    tons: 0,
    ton40s: 0,
    max180s: 0,
    highestFinish: 0,
    bestLeg: null,
    legsWon: 0,
    setsWon: 0,
  }
}

/** A dart counts as a checkout attempt when the score before it could be finished with that single dart. */
function isFinishableWithOneDart(score: number): boolean {
  return score === 50 || (score >= 2 && score <= 40 && score % 2 === 0)
}

export function applyDart(remaining: number, dart: Dart): { next: number; bust: boolean; checkout: boolean } {
  const next = remaining - dartPoints(dart)
  if (next < 0 || next === 1 || (next === 0 && !isDouble(dart))) {
    return { next: remaining, bust: true, checkout: false }
  }
  return { next, bust: false, checkout: next === 0 }
}

export function replay(config: MatchConfig, darts: Dart[]): MatchState {
  const n = config.players.length
  const stats = config.players.map(() => emptyStats())
  const legs: Leg[] = []
  const legsInSet = Array(n).fill(0)
  const setsWon = Array(n).fill(0)
  const totalLegsWon = Array(n).fill(0)
  let winner: number | null = null
  let setIndex = 0
  let legIndexInSet = 0

  let leg!: Leg
  let scores: number[] = []
  let player = 0
  let turn: Turn | null = null
  let legDarts: number[] = []
  let turnFirst9 = 0

  const startLeg = () => {
    // Starter rotates every leg; the starter of each new set also rotates.
    const starter = (setIndex + legIndexInSet) % n
    leg = { set: setIndex, starter, turns: [], winner: null }
    legs.push(leg)
    scores = Array(n).fill(config.startScore)
    player = starter
    turn = null
    legDarts = Array(n).fill(0)
  }

  const finishTurn = () => {
    if (!turn) return
    const s = stats[turn.player]
    if (!turn.bust) {
      if (turn.points >= 180) s.max180s++
      else if (turn.points >= 140) s.ton40s++
      else if (turn.points >= 100) s.tons++
    }
    leg.turns.push(turn)
    turn = null
    player = (player + 1) % n
  }

  startLeg()

  for (const dart of darts) {
    if (winner !== null) break
    if (!turn) {
      turn = { player, darts: [], startScore: scores[player], points: 0, bust: false, checkout: false }
      turnFirst9 = 0
    }

    const s = stats[player]
    const before = scores[player]
    const result = applyDart(before, dart)

    turn.darts.push(dart)
    s.darts++
    legDarts[player]++
    if (legDarts[player] <= 9) s.first9Darts++
    if (isFinishableWithOneDart(before)) s.checkoutDarts++

    if (result.bust) {
      // Points from earlier darts in a bust turn are taken back.
      s.points -= turn.points
      s.first9Points -= turnFirst9
      scores[player] = turn.startScore
      turn.points = 0
      turn.bust = true
      finishTurn()
      continue
    }

    const pts = dartPoints(dart)
    s.points += pts
    if (legDarts[player] <= 9) {
      s.first9Points += pts
      turnFirst9 += pts
    }
    turn.points += pts
    scores[player] = result.next

    if (result.checkout) {
      turn.checkout = true
      s.checkoutsHit++
      s.highestFinish = Math.max(s.highestFinish, turn.startScore)
      s.bestLeg = s.bestLeg === null ? legDarts[player] : Math.min(s.bestLeg, legDarts[player])
      s.legsWon++
      const legWinner = player
      leg.winner = legWinner
      finishTurn()

      totalLegsWon[legWinner]++
      legsInSet[legWinner]++
      legIndexInSet++

      if (legsInSet[legWinner] >= config.legsToWin) {
        setsWon[legWinner]++
        stats[legWinner].setsWon++
        if (setsWon[legWinner] >= config.setsToWin) {
          winner = legWinner
          break
        }
        legsInSet.fill(0)
        setIndex++
        legIndexInSet = 0
      }
      startLeg()
      continue
    }

    if (turn.darts.length === 3) finishTurn()
  }

  const currentTurn: Dart[] = turn ? (turn as Turn).darts : []

  return {
    config,
    legs,
    scores: scores,
    currentPlayer: player,
    currentTurn,
    legsInSet,
    setsWon,
    totalLegsWon,
    winner,
    stats,
  }
}

export function average(s: PlayerStats): number {
  return s.darts ? (s.points / s.darts) * 3 : 0
}

export function first9Average(s: PlayerStats): number {
  return s.first9Darts ? (s.first9Points / s.first9Darts) * 3 : 0
}

export function checkoutPercent(s: PlayerStats): number {
  return s.checkoutDarts ? (s.checkoutsHit / s.checkoutDarts) * 100 : 0
}

export function mergeStats(list: PlayerStats[]): PlayerStats {
  const out = emptyStats()
  for (const s of list) {
    out.darts += s.darts
    out.points += s.points
    out.first9Darts += s.first9Darts
    out.first9Points += s.first9Points
    out.checkoutDarts += s.checkoutDarts
    out.checkoutsHit += s.checkoutsHit
    out.tons += s.tons
    out.ton40s += s.ton40s
    out.max180s += s.max180s
    out.highestFinish = Math.max(out.highestFinish, s.highestFinish)
    if (s.bestLeg !== null) out.bestLeg = out.bestLeg === null ? s.bestLeg : Math.min(out.bestLeg, s.bestLeg)
    out.legsWon += s.legsWon
    out.setsWon += s.setsWon
  }
  return out
}
