import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { Stepper } from '../../components/Controls'
import { CheckIcon } from '../../components/Icons'
import { Sheet } from '../../components/Sheet'
import { generateRoundRobin } from '../../engine/league'
import { uid } from '../../lib/id'
import { adminRun } from '../../store/admin'
import { useData } from '../../store/data'
import { confirmDialog } from '../../store/ui'
import type { Fixture } from '../../types'

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function GenerateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const players = useData((s) => s.snapshot.players)
  const settings = useData((s) => s.snapshot.settings)
  const hasFixtures = useData((s) => s.snapshot.fixtures.length > 0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [rounds, setRounds] = useState(settings.rounds)

  useEffect(() => {
    if (open) {
      setSelected(new Set(players.map((p) => p.id)))
      setRounds(settings.rounds)
    }
    // Only reset when the sheet opens, not on every data refresh.
  }, [open])

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const generate = async () => {
    if (hasFixtures && !(await confirmDialog(t('league.regenerateConfirm'), { danger: true }))) return
    const ids = shuffle(players.filter((p) => selected.has(p.id)).map((p) => p.id))
    const fixtures: Fixture[] = generateRoundRobin(ids, rounds).map((f) => ({
      id: uid(),
      ...f,
      legs_home: null,
      legs_away: null,
      played_at: null,
      match_id: null,
    }))
    if (await adminRun('replaceFixtures', fixtures)) onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={hasFixtures ? t('league.regenerate') : t('league.generate')}>
      <div className="mb-2 px-1 text-[13px] font-semibold tracking-wider text-muted uppercase">{t('league.participants')}</div>
      <div className="flex flex-col gap-1.5">
        {players.map((p) => {
          const on = selected.has(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${on ? 'bg-accent-soft' : 'bg-surface-2'}`}
            >
              <Avatar name={p.name} color={p.color} size={32} />
              <span className="flex-1 font-semibold">{p.name}</span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${on ? 'bg-accent text-white' : 'border-2 border-line'}`}
              >
                {on && <CheckIcon size={14} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
        <div>
          <div className="font-medium">{t('settings.rounds')}</div>
          <div className="text-[13px] text-muted">{t('settings.roundsHint')}</div>
        </div>
        <Stepper value={rounds} min={1} max={4} onChange={setRounds} />
      </div>
      <Button className="mt-5" size="lg" block disabled={selected.size < 2} onClick={() => void generate()}>
        {selected.size < 2 ? t('league.needTwo') : t('league.generate')}
      </Button>
    </Sheet>
  )
}
