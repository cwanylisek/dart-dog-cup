import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { AppShell } from '../../components/AppShell'
import { Button } from '../../components/Button'
import { Card, EmptyState, SectionTitle } from '../../components/Card'
import { Segmented } from '../../components/Controls'
import { CalendarIcon, TrophyIcon, UsersIcon } from '../../components/Icons'
import { computeStandings } from '../../engine/league'
import { average } from '../../engine/x01'
import { lifetimeStats } from '../../lib/stats'
import { useData } from '../../store/data'
import { isPlayed, type Fixture } from '../../types'
import { FixtureCard } from './FixtureCard'
import { FixtureSheet } from './FixtureSheet'
import { GenerateSheet } from './GenerateSheet'
import { StandingsTable } from './StandingsTable'

type Tab = 'table' | 'schedule'

export default function LeaguePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'schedule' ? 'schedule' : 'table'
  const { settings, players, fixtures, matches } = useData((s) => s.snapshot)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])
  const participantIds = useMemo(() => {
    const inFixtures = new Set(fixtures.flatMap((f) => [f.home_id, f.away_id]))
    return players.filter((p) => inFixtures.has(p.id)).map((p) => p.id)
  }, [players, fixtures])

  const leagueMatches = useMemo(() => matches.filter((m) => m.fixture_id), [matches])
  const standings = useMemo(() => {
    const avgs: Record<string, number> = {}
    for (const [id, s] of lifetimeStats(leagueMatches)) avgs[id] = average(s.stats)
    return computeStandings(participantIds, fixtures, settings, avgs)
  }, [participantIds, fixtures, settings, leagueMatches])

  const rounds = useMemo(() => {
    const map = new Map<number, Fixture[]>()
    for (const f of fixtures) map.set(f.round, [...(map.get(f.round) ?? []), f])
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [fixtures])

  const playedCount = fixtures.filter(isPlayed).length
  const nextFixture = fixtures.find((f) => !isPlayed(f)) ?? null
  const selected = fixtures.find((f) => f.id === selectedId) ?? null

  const formatLine =
    t('league.format', { points: settings.points_per_leg, legs: settings.legs_to_win }) +
    (settings.match_win_bonus ? t('league.bonus', { bonus: settings.match_win_bonus }) : '')

  const body = () => {
    if (players.length < 2 && fixtures.length === 0) {
      return (
        <EmptyState
          icon={<UsersIcon size={30} />}
          title={t('league.noPlayers')}
          action={<Button onClick={() => navigate('/players')}>{t('league.goToPlayers')}</Button>}
        />
      )
    }
    if (fixtures.length === 0) {
      return (
        <EmptyState
          icon={<CalendarIcon size={30} />}
          title={t('league.noSchedule')}
          hint={t('league.noScheduleHint')}
          action={<Button onClick={() => setGenerating(true)}>{t('league.generate')}</Button>}
        />
      )
    }

    if (tab === 'table') {
      return (
        <>
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {nextFixture ? t('league.progress', { played: playedCount, total: fixtures.length }) : t('league.completed')}
              </span>
              <span className="tabular text-muted">{Math.round((playedCount / fixtures.length) * 100)}%</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={false}
                animate={{ width: `${(playedCount / fixtures.length) * 100}%` }}
              />
            </div>
            {nextFixture && (
              <>
                <div className="mt-4 mb-1 text-[12px] font-semibold tracking-wider text-muted uppercase">{t('league.nextUp')}</div>
                <FixtureCard fixture={nextFixture} players={playerMap} onClick={() => setSelectedId(nextFixture.id)} highlight />
              </>
            )}
          </Card>
          <StandingsTable rows={standings} players={players} />
          <div className="mt-3 px-1 text-xs leading-relaxed text-muted">
            {formatLine}
            <br />
            {t('league.tiebreak')}
          </div>
        </>
      )
    }

    return (
      <div className="flex flex-col gap-2">
        {rounds.map(([round, list]) => {
          const done = list.every(isPlayed)
          return (
            <div key={round} className="[&:not(:first-child)]:mt-3">
              <SectionTitle action={done && <span className="text-xs font-semibold text-success">✓</span>}>
                {t('league.round', { n: round })}
              </SectionTitle>
              <Card className="p-1">
                {list.map((f) => (
                  <FixtureCard
                    key={f.id}
                    fixture={f}
                    players={playerMap}
                    onClick={() => setSelectedId(f.id)}
                    highlight={f.id === nextFixture?.id}
                  />
                ))}
              </Card>
            </div>
          )
        })}
        <Button variant="secondary" block className="mt-6" onClick={() => setGenerating(true)}>
          {t('league.regenerate')}
        </Button>
      </div>
    )
  }

  return (
    <AppShell
      title={
        <span className="flex items-center gap-2">
          <TrophyIcon size={20} className="text-accent" />
          {settings.name}
        </span>
      }
    >
      {fixtures.length > 0 && (
        <Segmented
          className="mb-4"
          value={tab}
          onChange={(v) => setParams(v === 'table' ? {} : { tab: v }, { replace: true })}
          options={[
            { value: 'table', label: t('league.table') },
            { value: 'schedule', label: t('league.schedule') },
          ]}
        />
      )}
      {body()}
      <FixtureSheet fixture={selected} players={playerMap} onClose={() => setSelectedId(null)} />
      <GenerateSheet open={generating} onClose={() => setGenerating(false)} />
    </AppShell>
  )
}
