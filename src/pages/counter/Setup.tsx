import { motion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { Card, SectionTitle } from '../../components/Card'
import { Segmented, Stepper } from '../../components/Controls'
import { CloseIcon, PlayIcon, PlusIcon, SwapIcon } from '../../components/Icons'
import { Sheet } from '../../components/Sheet'
import type { MatchConfig } from '../../engine/x01'
import { useData } from '../../store/data'
import { useGame } from '../../store/game'

type Slot = MatchConfig['players'][number]

const MAX_PLAYERS = 2
const LAST_SETUP_KEY = 'ddc:last-setup'

function readLastSetup(): Partial<MatchConfig> {
  try {
    return JSON.parse(localStorage.getItem(LAST_SETUP_KEY) || '{}') as Partial<MatchConfig>
  } catch {
    return {}
  }
}

export function Setup() {
  const { t } = useTranslation()
  const start = useGame((s) => s.start)
  const players = useData((s) => s.snapshot.players)
  const settings = useData((s) => s.snapshot.settings)
  const last = readLastSetup()

  const [startScore, setStartScore] = useState<number>(last.startScore ?? settings.start_score)
  const [legsToWin, setLegsToWin] = useState<number>(last.legsToWin ?? settings.legs_to_win)
  const [setsToWin, setSetsToWin] = useState<number>(last.setsToWin ?? 1)
  const [slots, setSlots] = useState<Slot[]>(() =>
    (last.players ?? []).filter((p) => !p.playerId || players.some((x) => x.id === p.playerId)),
  )
  const [picker, setPicker] = useState(false)
  const [guest, setGuest] = useState('')

  const colorOf = (id: string | null) => players.find((p) => p.id === id)?.color
  const available = players.filter((p) => !slots.some((s) => s.playerId === p.id))

  const add = (slot: Slot) => {
    setSlots((s) => [...s, slot].slice(0, MAX_PLAYERS))
    setPicker(false)
    setGuest('')
  }

  const begin = () => {
    const config: MatchConfig = { startScore, legsToWin, setsToWin, players: slots }
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify(config))
    start(config)
  }

  return (
    <div className="flex flex-col">
      <SectionTitle>{t('counter.gameType')}</SectionTitle>
      <Segmented
        value={startScore}
        onChange={setStartScore}
        options={[
          { value: 501, label: '501' },
          { value: 301, label: '301' },
        ]}
      />

      <SectionTitle>{t('counter.format')}</SectionTitle>
      <Card>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-[15px] font-medium">{t('counter.legs')}</div>
            <div className="text-[13px] text-muted">
              {t('counter.firstTo', { n: legsToWin })} · {t('counter.bestOf', { n: legsToWin * 2 - 1 })}
            </div>
          </div>
          <Stepper value={legsToWin} min={1} max={11} onChange={setLegsToWin} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[15px] font-medium">{t('counter.sets')}</div>
            {setsToWin > 1 && <div className="text-[13px] text-muted">{t('counter.setsFirstTo', { n: setsToWin })}</div>}
          </div>
          <Stepper
            value={setsToWin}
            min={1}
            max={7}
            onChange={setSetsToWin}
            format={(v) => (v === 1 ? t('counter.setsOff') : String(v))}
          />
        </div>
      </Card>

      <SectionTitle
        action={
          slots.length === 2 && (
            <button
              onClick={() => setSlots((s) => [...s].reverse())}
              className="flex items-center gap-1 text-sm font-semibold text-accent"
            >
              <SwapIcon size={16} />
              {t('counter.swap')}
            </button>
          )
        }
      >
        {t('counter.players')}
      </SectionTitle>
      <div className="flex flex-col gap-2">
        {slots.map((s, i) => (
          <motion.div layout key={`${s.playerId ?? s.name}`}>
            <Card className="flex items-center gap-3 px-4 py-3">
              <Avatar name={s.name} color={colorOf(s.playerId)} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.name}</div>
                <div className="text-[13px] text-muted">
                  {[i === 0 ? t('counter.throwsFirst') : null, s.playerId ? null : t('common.guest')].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button
                aria-label={t('counter.remove')}
                onClick={() => setSlots((list) => list.filter((_, j) => j !== i))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:bg-surface-2"
              >
                <CloseIcon size={18} />
              </button>
            </Card>
          </motion.div>
        ))}
        {slots.length < MAX_PLAYERS && (
          <button
            onClick={() => setPicker(true)}
            className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line py-4 font-semibold text-accent active:bg-surface-2"
          >
            <PlusIcon size={20} />
            {t('counter.addPlayer')}
          </button>
        )}
      </div>

      <div className="mt-8">
        <Button size="lg" block disabled={slots.length === 0} onClick={begin}>
          <PlayIcon size={18} />
          {t('counter.start')}
        </Button>
        {slots.length === 0 && <div className="mt-2 text-center text-sm text-muted">{t('counter.needPlayer')}</div>}
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title={t('counter.pickPlayer')}>
        {available.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {available.map((p) => (
              <button
                key={p.id}
                onClick={() => add({ playerId: p.id, name: p.name })}
                className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3 py-3 text-left font-semibold active:bg-surface-3"
              >
                <Avatar name={p.name} color={p.color} size={32} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (guest.trim()) add({ playerId: null, name: guest.trim() })
          }}
        >
          <input
            value={guest}
            onChange={(e) => setGuest(e.target.value)}
            placeholder={t('counter.guestName')}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-transparent bg-surface-2 px-4 outline-none focus:border-accent"
          />
          <Button type="submit" disabled={!guest.trim()} className="h-12">
            {t('common.add')}
          </Button>
        </form>
      </Sheet>
    </div>
  )
}
