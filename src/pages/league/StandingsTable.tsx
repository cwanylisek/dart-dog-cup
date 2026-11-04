import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../../components/Avatar'
import { Card } from '../../components/Card'
import type { StandingRow } from '../../engine/league'
import type { Player } from '../../types'

const COLS = 'grid-cols-[22px_minmax(0,1fr)_26px_26px_26px_34px_38px] sm:grid-cols-[22px_minmax(0,1fr)_28px_28px_28px_30px_30px_36px_40px]'

export function StandingsTable({ rows, players }: { rows: StandingRow[]; players: Player[] }) {
  const { t } = useTranslation()
  const byId = new Map(players.map((p) => [p.id, p]))

  return (
    <Card className="overflow-hidden">
      <div className={`grid ${COLS} items-center gap-1.5 border-b border-line px-3 py-2.5 text-[11px] font-semibold tracking-wide text-muted uppercase`}>
        <span className="text-center">{t('league.pos')}</span>
        <span className="pl-1">{t('league.player')}</span>
        <span className="text-center">{t('league.played')}</span>
        <span className="text-center">{t('league.won')}</span>
        <span className="text-center">{t('league.lost')}</span>
        <span className="hidden text-center sm:block">{t('league.legsFor')}</span>
        <span className="hidden text-center sm:block">{t('league.legsAgainst')}</span>
        <span className="text-center">{t('league.diff')}</span>
        <span className="text-center">{t('league.points')}</span>
      </div>
      {rows.map((r, i) => {
        const p = byId.get(r.playerId)
        const name = p?.name ?? '?'
        const leader = i === 0 && r.played > 0
        return (
          <motion.div
            layout
            key={r.playerId}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={`grid ${COLS} items-center gap-1.5 border-b border-line px-3 py-3 text-sm last:border-b-0 ${leader ? 'bg-accent-soft' : ''}`}
          >
            <span className={`tabular text-center font-bold ${leader ? 'text-accent' : 'text-muted'}`}>{i + 1}</span>
            <span className="flex min-w-0 items-center gap-2 pl-1">
              <Avatar name={name} color={p?.color} size={28} />
              <span className="truncate font-semibold">{name}</span>
            </span>
            <span className="tabular text-center text-muted">{r.played}</span>
            <span className="tabular text-center">{r.won}</span>
            <span className="tabular text-center">{r.lost}</span>
            <span className="tabular hidden text-center text-muted sm:block">{r.legsFor}</span>
            <span className="tabular hidden text-center text-muted sm:block">{r.legsAgainst}</span>
            <span className={`tabular text-center ${r.legDiff > 0 ? 'text-success' : r.legDiff < 0 ? 'text-danger' : 'text-muted'}`}>
              {r.legDiff > 0 ? `+${r.legDiff}` : r.legDiff}
            </span>
            <span className="tabular text-center text-base font-extrabold">{r.points}</span>
          </motion.div>
        )
      })}
    </Card>
  )
}
