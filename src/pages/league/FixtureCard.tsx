import { useTranslation } from 'react-i18next'
import { Avatar } from '../../components/Avatar'
import { isPlayed, type Fixture, type Player } from '../../types'

export function FixtureCard({
  fixture,
  players,
  onClick,
  highlight,
}: {
  fixture: Fixture
  players: Map<string, Player>
  onClick?: () => void
  highlight?: boolean
}) {
  const { t } = useTranslation()
  const home = players.get(fixture.home_id)
  const away = players.get(fixture.away_id)
  const played = isPlayed(fixture)
  const homeWon = played && fixture.legs_home! > fixture.legs_away!
  const awayWon = played && fixture.legs_away! > fixture.legs_home!

  return (
    <button
      onClick={onClick}
      className={`grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl px-3 py-3 text-left transition-colors active:bg-surface-2 ${
        highlight ? 'bg-accent-soft ring-1 ring-accent/40' : ''
      }`}
    >
      <span className={`flex min-w-0 items-center gap-2 ${played && !homeWon ? 'opacity-55' : ''}`}>
        <Avatar name={home?.name ?? '?'} color={home?.color} size={30} />
        <span className="truncate text-[15px] font-semibold">{home?.name ?? '?'}</span>
      </span>
      <span
        className={`tabular min-w-16 rounded-xl px-2.5 py-1.5 text-center text-[15px] font-extrabold ${
          played ? 'bg-surface-2' : 'text-xs font-semibold text-muted uppercase'
        }`}
      >
        {played ? `${fixture.legs_home} – ${fixture.legs_away}` : t('common.vs')}
      </span>
      <span className={`flex min-w-0 flex-row-reverse items-center gap-2 text-right ${played && !awayWon ? 'opacity-55' : ''}`}>
        <Avatar name={away?.name ?? '?'} color={away?.color} size={30} />
        <span className="truncate text-[15px] font-semibold">{away?.name ?? '?'}</span>
      </span>
    </button>
  )
}
