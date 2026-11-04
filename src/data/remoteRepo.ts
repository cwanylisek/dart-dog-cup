import type { SupabaseClient } from '@supabase/supabase-js'
import { uid } from '../lib/id'
import { DEFAULT_SETTINGS, type Fixture, type LeagueSettings, type MatchRecord, type Player } from '../types'
import { InvalidPinError, NetworkError, type Repo } from './repo'

const SETTINGS_COLUMNS = 'name,points_per_leg,match_win_bonus,legs_to_win,start_score,rounds'
const FIXTURE_COLUMNS = 'id,round,home_id,away_id,legs_home,legs_away,played_at,match_id'

function toError(error: { message: string } | null): Error | null {
  if (!error) return null
  const msg = error.message || ''
  if (msg.includes('invalid_pin')) return new InvalidPinError()
  if (!navigator.onLine || /failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return new NetworkError(msg)
  }
  return new Error(msg)
}

async function call(client: SupabaseClient, fn: string, params: Record<string, unknown>) {
  let result
  try {
    result = await client.rpc(fn, params)
  } catch (e) {
    throw new NetworkError(e instanceof Error ? e.message : String(e))
  }
  const err = toError(result.error)
  if (err) throw err
  return result.data
}

export function createRemoteRepo(client: SupabaseClient): Repo {
  return {
    mode: 'remote',

    async load() {
      let results
      try {
        results = await Promise.all([
          client.from('settings').select(SETTINGS_COLUMNS).eq('id', 1).maybeSingle(),
          client.from('players').select('id,name,color,created_at').order('created_at'),
          client.from('fixtures').select(FIXTURE_COLUMNS).order('round').order('seq'),
          client.from('matches').select('*').order('created_at', { ascending: false }).limit(1000),
        ])
      } catch (e) {
        throw new NetworkError(e instanceof Error ? e.message : String(e))
      }
      const [s, p, f, m] = results
      const err = toError(s.error ?? p.error ?? f.error ?? m.error)
      if (err) throw err
      return {
        settings: { ...DEFAULT_SETTINGS, ...((s.data as LeagueSettings | null) ?? {}) },
        players: (p.data ?? []) as Player[],
        fixtures: (f.data ?? []) as Fixture[],
        matches: (m.data ?? []) as MatchRecord[],
      }
    },

    async verifyPin(pin) {
      return Boolean(await call(client, 'verify_pin', { p_pin: pin }))
    },
    async changePin(pin, newPin) {
      await call(client, 'change_pin', { p_pin: pin, p_new_pin: newPin })
    },
    async savePlayer(pin, player) {
      await call(client, 'save_player', { p_pin: pin, p_player: player })
    },
    async deletePlayer(pin, id) {
      await call(client, 'delete_player', { p_pin: pin, p_id: id })
    },
    async saveSettings(pin, settings) {
      await call(client, 'save_settings', { p_pin: pin, p_settings: settings })
    },
    async replaceFixtures(pin, fixtures) {
      await call(client, 'replace_fixtures', { p_pin: pin, p_fixtures: fixtures })
    },
    async setResult(pin, fixtureId, legsHome, legsAway, matchId) {
      await call(client, 'set_result', {
        p_pin: pin,
        p_fixture_id: fixtureId,
        p_legs_home: legsHome,
        p_legs_away: legsAway,
        p_match_id: matchId,
      })
    },
    async saveMatch(pin, match) {
      await call(client, 'save_match', { p_pin: pin, p_match: match })
    },

    subscribe(onChange) {
      let timer: ReturnType<typeof setTimeout> | undefined
      const debounced = () => {
        clearTimeout(timer)
        timer = setTimeout(onChange, 300)
      }
      const channel = client.channel(`ddc-changes-${uid()}`)
      for (const table of ['settings', 'players', 'fixtures', 'matches']) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, debounced)
      }
      channel.subscribe()
      return () => {
        clearTimeout(timer)
        void client.removeChannel(channel)
      }
    },
  }
}
