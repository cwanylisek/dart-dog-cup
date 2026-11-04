import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckIcon, TrophyIcon, UndoIcon } from '../../components/Icons'
import type { Dart } from '../../engine/darts'
import { average, checkoutPercent, first9Average, replay, type MatchConfig } from '../../engine/x01'
import { InvalidPinError } from '../../data/repo'
import { requirePin } from '../../store/admin'
import { useData } from '../../store/data'
import { toMatchRecord, useGame } from '../../store/game'
import { toast } from '../../store/ui'

export function Summary({ config, darts }: { config: MatchConfig; darts: Dart[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useMemo(() => replay(config, darts), [config, darts])
  const { fixtureId, matchId, saveState, setSaveState, undo, rematch, quit } = useGame()
  const fixtures = useData((s) => s.snapshot.fixtures)
  const players = useData((s) => s.snapshot.players)
  const run = useData((s) => s.run)
  const [busy, setBusy] = useState(false)

  const winner = state.winner!
  const fixture = fixtureId ? fixtures.find((f) => f.id === fixtureId) : undefined
  const hasRegistered = config.players.some((p) => p.playerId)
  const needsSave = hasRegistered || Boolean(fixture)
  const saved = saveState === 'saved'
  const colorOf = (id: string | null) => players.find((p) => p.id === id)?.color

  const save = async () => {
    setBusy(true)
    setSaveState('saving')
    try {
      const pin = await requirePin()
      if (pin === null) {
        setSaveState('needs-pin')
        return
      }
      const record = toMatchRecord(state, matchId!, fixture?.id ?? null)
      await run(pin, 'saveMatch', record)
      if (fixture) {
        const homeIdx = config.players.findIndex((p) => p.playerId === fixture.home_id)
        const awayIdx = config.players.findIndex((p) => p.playerId === fixture.away_id)
        await run(pin, 'setResult', fixture.id, state.totalLegsWon[homeIdx], state.totalLegsWon[awayIdx], record.id)
        toast(t('summary.resultRecorded'), 'success')
      } else {
        toast(t('summary.saved'), 'success')
      }
      setSaveState('saved')
    } catch (e) {
      console.error(e)
      toast(e instanceof InvalidPinError ? t('pin.wrong') : t('common.error'), 'error')
      setSaveState('error')
    } finally {
      setBusy(false)
    }
  }

  const rows: { label: string; value: (i: number) => string }[] = [
    { label: t('summary.legsWon'), value: (i) => String(state.totalLegsWon[i]) },
    { label: t('summary.average'), value: (i) => average(state.stats[i]).toFixed(2) },
    { label: t('summary.first9'), value: (i) => first9Average(state.stats[i]).toFixed(2) },
    {
      label: t('summary.checkout'),
      value: (i) => `${checkoutPercent(state.stats[i]).toFixed(0)}% (${state.stats[i].checkoutsHit}/${state.stats[i].checkoutDarts})`,
    },
    { label: t('summary.highestFinish'), value: (i) => String(state.stats[i].highestFinish || '–') },
    { label: t('summary.bestLeg'), value: (i) => String(state.stats[i].bestLeg ?? '–') },
    { label: t('summary.tons'), value: (i) => String(state.stats[i].tons) },
    { label: t('summary.ton40s'), value: (i) => String(state.stats[i].ton40s) },
    { label: t('summary.max'), value: (i) => String(state.stats[i].max180s) },
  ]

  const leave = (to: 'rematch' | 'new' | 'league') => {
    if (to === 'rematch') rematch()
    else quit()
    if (to === 'league') navigate('/league?tab=schedule')
  }

  return (
    <div className="pb-safe flex flex-col gap-4 overflow-y-auto px-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-accent p-6 text-white shadow-[0_20px_40px_-16px_var(--accent)]"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-16 h-40 w-40 rounded-full bg-white/10" />
        <TrophyIcon size={32} />
        <div className="mt-3 text-sm font-semibold opacity-80">{t('summary.title')}</div>
        <div className="text-3xl font-extrabold tracking-tight">{t('summary.wins', { name: config.players[winner].name })}</div>
        {config.players.length > 1 && (
          <div className="tabular mt-2 text-xl font-bold opacity-90">
            {config.setsToWin > 1 ? state.setsWon.join(' – ') : state.totalLegsWon.join(' – ')}
          </div>
        )}
      </motion.div>

      <Card className="overflow-hidden">
        <div className={`grid items-center gap-2 border-b border-line px-4 py-3 ${config.players.length > 1 ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]'}`}>
          <span />
          {config.players.map((p, i) => (
            <span key={i} className="flex w-24 flex-col items-center gap-1 text-center text-xs font-semibold">
              <Avatar name={p.name} color={colorOf(p.playerId)} size={28} />
              <span className="w-full truncate">{p.name}</span>
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div
            key={r.label}
            className={`grid items-center gap-2 border-b border-line px-4 py-2.5 text-sm last:border-b-0 ${config.players.length > 1 ? 'grid-cols-[1fr_auto_auto]' : 'grid-cols-[1fr_auto]'}`}
          >
            <span className="text-muted">{r.label}</span>
            {config.players.map((_, i) => (
              <span key={i} className="tabular w-24 text-center font-bold">
                {r.value(i)}
              </span>
            ))}
          </div>
        ))}
      </Card>

      {needsSave && !saved ? (
        <div className="flex flex-col gap-2">
          <Button size="lg" block onClick={() => void save()} disabled={busy}>
            <CheckIcon />
            {busy
              ? t('summary.saving')
              : fixture
                ? `${t('common.save')} ${state.totalLegsWon[config.players.findIndex((p) => p.playerId === fixture.home_id)]} – ${state.totalLegsWon[config.players.findIndex((p) => p.playerId === fixture.away_id)]}`
                : t('common.save')}
          </Button>
          <Button variant="ghost" block onClick={undo} disabled={busy}>
            <UndoIcon size={18} />
            {t('counter.undo')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {fixture ? (
            <Button size="lg" block onClick={() => leave('league')}>
              {t('summary.toLeague')}
            </Button>
          ) : (
            <Button size="lg" block onClick={() => leave('rematch')}>
              {t('summary.rematch')}
            </Button>
          )}
          <Button variant="secondary" block onClick={() => leave('new')}>
            {t('summary.newGame')}
          </Button>
          {!needsSave && (
            <Button variant="ghost" block onClick={undo}>
              <UndoIcon size={18} />
              {t('counter.undo')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
