import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { PlayIcon } from '../../components/Icons'
import { Sheet } from '../../components/Sheet'
import { possibleResults } from '../../engine/league'
import { adminRun } from '../../store/admin'
import { useData } from '../../store/data'
import { useGame } from '../../store/game'
import { confirmDialog } from '../../store/ui'
import { isPlayed, type Fixture, type Player } from '../../types'
import { FixtureCard } from './FixtureCard'

export function FixtureSheet({
  fixture,
  players,
  onClose,
}: {
  fixture: Fixture | null
  players: Map<string, Player>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useData((s) => s.snapshot.settings)
  const start = useGame((s) => s.start)
  const gameInProgress = useGame((s) => s.config !== null && s.darts.length > 0)

  const play = async () => {
    if (!fixture) return
    const home = players.get(fixture.home_id)
    const away = players.get(fixture.away_id)
    if (!home || !away) return
    if (gameInProgress && !(await confirmDialog(t('counter.quitConfirm'), { danger: true }))) return
    start(
      {
        startScore: settings.start_score,
        legsToWin: settings.legs_to_win,
        setsToWin: 1,
        players: [
          { playerId: home.id, name: home.name },
          { playerId: away.id, name: away.name },
        ],
      },
      fixture.id,
    )
    onClose()
    navigate('/counter')
  }

  const setResult = async (lh: number | null, la: number | null) => {
    if (!fixture) return
    if (await adminRun('setResult', fixture.id, lh, la, null)) onClose()
  }

  const home = fixture ? players.get(fixture.home_id) : undefined
  const away = fixture ? players.get(fixture.away_id) : undefined

  return (
    <Sheet open={fixture !== null} onClose={onClose} title={t('league.round', { n: fixture?.round ?? 0 })}>
      {fixture && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-surface-2 p-1">
            <FixtureCard fixture={fixture} players={players} />
          </div>

          <Button size="lg" block onClick={() => void play()}>
            <PlayIcon size={18} />
            {t('league.play')}
          </Button>

          <div>
            <div className="mb-2 px-1 text-[13px] font-semibold tracking-wider text-muted uppercase">{t('league.enterResult')}</div>
            <div className="grid grid-cols-2 gap-2">
              {possibleResults(settings.legs_to_win).map(([lh, la]) => {
                const active = fixture.legs_home === lh && fixture.legs_away === la
                const winner = lh > la ? home : away
                return (
                  <button
                    key={`${lh}-${la}`}
                    onClick={() => void setResult(lh, la)}
                    className={`flex flex-col items-center rounded-2xl px-3 py-3 transition-colors ${
                      active ? 'bg-accent text-white' : 'bg-surface-2 active:bg-surface-3'
                    }`}
                  >
                    <span className="tabular text-xl font-extrabold">
                      {lh} – {la}
                    </span>
                    <span className={`max-w-full truncate text-xs ${active ? 'text-white/80' : 'text-muted'}`}>{winner?.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {isPlayed(fixture) && (
            <Button variant="danger" block onClick={() => void setResult(null, null)}>
              {t('league.clearResult')}
            </Button>
          )}
        </div>
      )}
    </Sheet>
  )
}
