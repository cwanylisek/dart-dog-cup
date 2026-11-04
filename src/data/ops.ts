import { DEFAULT_SETTINGS, type Fixture, type LeagueSettings, type MatchRecord, type Player, type Snapshot } from '../types'
import type { RepoOp } from './repo'

export type OpArgs = {
  savePlayer: [Player]
  deletePlayer: [string]
  saveSettings: [LeagueSettings]
  replaceFixtures: [Fixture[]]
  setResult: [string, number | null, number | null, string | null]
  saveMatch: [MatchRecord]
}

export function emptySnapshot(): Snapshot {
  return { settings: { ...DEFAULT_SETTINGS }, players: [], fixtures: [], matches: [] }
}

/** Pure reducer shared by the local repo and the optimistic updates in the store. */
export function applyOp<K extends RepoOp>(snap: Snapshot, op: K, args: OpArgs[K]): Snapshot {
  switch (op) {
    case 'savePlayer': {
      const [player] = args as OpArgs['savePlayer']
      const exists = snap.players.some((p) => p.id === player.id)
      return {
        ...snap,
        players: exists ? snap.players.map((p) => (p.id === player.id ? player : p)) : [...snap.players, player],
      }
    }
    case 'deletePlayer': {
      const [id] = args as OpArgs['deletePlayer']
      return {
        ...snap,
        players: snap.players.filter((p) => p.id !== id),
        fixtures: snap.fixtures.filter((f) => f.home_id !== id && f.away_id !== id),
      }
    }
    case 'saveSettings': {
      const [settings] = args as OpArgs['saveSettings']
      return { ...snap, settings }
    }
    case 'replaceFixtures': {
      const [fixtures] = args as OpArgs['replaceFixtures']
      return { ...snap, fixtures }
    }
    case 'setResult': {
      const [fixtureId, legsHome, legsAway, matchId] = args as OpArgs['setResult']
      const played = legsHome !== null && legsAway !== null
      return {
        ...snap,
        fixtures: snap.fixtures.map((f) =>
          f.id === fixtureId
            ? {
                ...f,
                legs_home: legsHome,
                legs_away: legsAway,
                match_id: played ? matchId : null,
                played_at: played ? new Date().toISOString() : null,
              }
            : f,
        ),
      }
    }
    case 'saveMatch': {
      const [match] = args as OpArgs['saveMatch']
      return { ...snap, matches: [match, ...snap.matches.filter((m) => m.id !== match.id)] }
    }
  }
  return snap
}
