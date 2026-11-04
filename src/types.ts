import type { PlayerStats } from './engine/x01'

export interface Player {
  id: string
  name: string
  color: string
  created_at: string
}

export interface LeagueSettings {
  name: string
  points_per_leg: number
  match_win_bonus: number
  legs_to_win: number
  start_score: number
  rounds: number
}

export interface Fixture {
  id: string
  round: number
  home_id: string
  away_id: string
  legs_home: number | null
  legs_away: number | null
  played_at: string | null
  match_id: string | null
}

export interface MatchPlayerRecord {
  player_id: string | null
  name: string
}

export interface MatchRecord {
  id: string
  created_at: string
  fixture_id: string | null
  start_score: number
  legs_to_win: number
  sets_to_win: number
  players: MatchPlayerRecord[]
  winner_index: number | null
  legs_won: number[]
  sets_won: number[]
  stats: PlayerStats[]
}

export interface Snapshot {
  settings: LeagueSettings
  players: Player[]
  fixtures: Fixture[]
  matches: MatchRecord[]
}

export const DEFAULT_SETTINGS: LeagueSettings = {
  name: 'Dart Dog Cup',
  points_per_leg: 1,
  match_win_bonus: 0,
  legs_to_win: 2,
  start_score: 501,
  rounds: 1,
}

export function isPlayed(f: Fixture): boolean {
  return f.legs_home !== null && f.legs_away !== null
}
