import type { Fixture, LeagueSettings, MatchRecord, Player, Snapshot } from '../types'

export class InvalidPinError extends Error {
  constructor() {
    super('invalid_pin')
  }
}

export class NetworkError extends Error {}

/** All writes take the admin PIN. The local repo ignores it. */
export interface Repo {
  mode: 'local' | 'remote'
  load(): Promise<Snapshot>
  verifyPin(pin: string): Promise<boolean>
  changePin(pin: string, newPin: string): Promise<void>
  savePlayer(pin: string, player: Player): Promise<void>
  deletePlayer(pin: string, id: string): Promise<void>
  saveSettings(pin: string, settings: LeagueSettings): Promise<void>
  replaceFixtures(pin: string, fixtures: Fixture[]): Promise<void>
  setResult(pin: string, fixtureId: string, legsHome: number | null, legsAway: number | null, matchId: string | null): Promise<void>
  saveMatch(pin: string, match: MatchRecord): Promise<void>
  subscribe(onChange: () => void): () => void
}

export type RepoOp = 'savePlayer' | 'deletePlayer' | 'saveSettings' | 'replaceFixtures' | 'setResult' | 'saveMatch'
