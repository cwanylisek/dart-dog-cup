import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../../components/Avatar'
import { canCheckout, suggest } from '../../engine/checkout'
import { dartLabel, type Dart } from '../../engine/darts'
import { average, replay, type MatchConfig, type MatchState, type Turn } from '../../engine/x01'
import { useWakeLock } from '../../hooks/useWakeLock'
import { speak } from '../../lib/voice'
import { useData } from '../../store/data'
import { useGame } from '../../store/game'
import { usePrefs } from '../../store/prefs'
import { Keypad } from './Keypad'

interface Flash {
  id: number
  text: string
  tone: 'bust' | 'max' | 'leg'
}

function allTurns(s: MatchState): Turn[] {
  return s.legs.flatMap((l) => l.turns)
}

export function Game({ config, darts }: { config: MatchConfig; darts: Dart[] }) {
  const { t } = useTranslation()
  const throwDart = useGame((s) => s.throwDart)
  const undo = useGame((s) => s.undo)
  const voice = usePrefs((s) => s.voice)
  const language = usePrefs((s) => s.language)
  const wakeLock = usePrefs((s) => s.wakeLock)
  const players = useData((s) => s.snapshot.players)
  const [flash, setFlash] = useState<Flash | null>(null)
  const flashId = useRef(0)

  useWakeLock(wakeLock)

  const state = useMemo(() => replay(config, darts), [config, darts])
  const dartsLeft = 3 - state.currentTurn.length
  const remaining = state.scores[state.currentPlayer]
  const suggestion = useMemo(() => suggest(remaining, dartsLeft), [remaining, dartsLeft])
  const hint = suggestion.kind === 'none' ? null : suggestion.darts[0] ?? null
  const turnTotal = state.currentTurn.reduce((a, d) => a + d.mult * d.value, 0)
  const colorOf = (playerId: string | null) => players.find((p) => p.id === playerId)?.color

  const showFlash = (text: string, tone: Flash['tone']) => {
    const id = ++flashId.current
    setFlash({ id, text, tone })
    setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 1300)
  }

  const onDart = (dart: Dart) => {
    const before = state
    throwDart(dart)
    const after = replay(config, [...darts, dart])
    if (allTurns(after).length === allTurns(before).length) return

    const turn = allTurns(after).at(-1)!
    const name = config.players[turn.player].name
    const legWon = after.legs.length > before.legs.length || after.winner !== null
    const lines: string[] = []

    if (after.winner !== null) {
      lines.push(t('voice.match'))
    } else if (legWon) {
      lines.push(t('voice.leg'))
      showFlash(`${name} · ${t('voice.gameShot')}`, 'leg')
    } else if (turn.bust) {
      lines.push(t('voice.bust'))
      showFlash(t('counter.bust'), 'bust')
      navigator.vibrate?.([60, 40, 60])
    } else {
      lines.push(turn.points === 0 ? t('voice.noScore') : String(turn.points))
      if (turn.points === 180) showFlash('180', 'max')
    }

    if (after.winner === null) {
      const next = after.currentPlayer
      const left = after.scores[next]
      if (left <= 170 && canCheckout(left, 3)) {
        lines.push(t('voice.requires', { name: config.players[next].name, score: left }))
      }
    }
    if (voice) speak(lines, language)
  }

  const multiPlayer = config.players.length > 1

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {/* Scoreboard */}
      <div className={`grid shrink-0 gap-2.5 ${multiPlayer ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {config.players.map((p, i) => {
          const active = i === state.currentPlayer
          return (
            <motion.div
              key={i}
              animate={{ opacity: active || !multiPlayer ? 1 : 0.6, scale: active ? 1 : 0.98 }}
              className={`relative overflow-hidden rounded-3xl border p-3.5 ${
                active ? 'border-accent/60 bg-surface shadow-[0_10px_30px_-12px_var(--accent)]' : 'border-line bg-surface'
              }`}
            >
              {active && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/12 to-transparent" />}
              <div className="relative flex items-center gap-2">
                <Avatar name={p.name} color={colorOf(p.playerId)} size={26} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                <span className="tabular rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold">
                  {config.setsToWin > 1 ? `${state.setsWon[i]}·${state.legsInSet[i]}` : state.totalLegsWon[i]}
                </span>
              </div>
              <div className="tabular relative mt-1 text-[56px] leading-none font-extrabold tracking-tight">
                {state.scores[i]}
              </div>
              <div className="relative mt-2 flex justify-between text-xs text-muted">
                <span>
                  {t('counter.avg')} <b className="tabular text-text">{average(state.stats[i]).toFixed(1)}</b>
                </span>
                {active && <span className="font-semibold text-accent">{t('counter.toThrow')}</span>}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Turn + suggestion */}
      <div className="shrink-0 rounded-3xl border border-line bg-surface p-3">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => {
            const d = state.currentTurn[i]
            return (
              <div
                key={i}
                className={`tabular flex h-10 flex-1 items-center justify-center rounded-xl text-[15px] font-bold ${
                  d ? 'bg-surface-2' : 'border border-dashed border-line text-muted'
                }`}
              >
                {d ? dartLabel(d) : '–'}
              </div>
            )
          })}
          <div className="tabular w-14 text-right text-2xl font-extrabold">{turnTotal}</div>
        </div>
        <div className="mt-2.5 flex min-h-7 items-center gap-2 text-sm">
          {suggestion.kind === 'checkout' && (
            <>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white uppercase">{t('counter.checkout')}</span>
              <span className="tabular font-bold">{suggestion.darts.map(dartLabel).join(' · ')}</span>
            </>
          )}
          {suggestion.kind === 'setup' && remaining <= 230 && (
            <>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted uppercase">{t('counter.setup')}</span>
              <span className="tabular font-bold">{suggestion.darts.map(dartLabel).join(' · ')}</span>
              <span className="text-muted">→ {t('counter.leave', { score: suggestion.leave })}</span>
            </>
          )}
          {suggestion.kind === 'setup' && remaining > 230 && (
            <span className="text-muted">
              {t('counter.darts')}: <b className="tabular text-text">{dartsLeft}</b>
            </span>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="min-h-0 flex-1">
        <Keypad
          onDart={onDart}
          onUndo={undo}
          canUndo={darts.length > 0}
          hint={hint}
          disabled={state.winner !== null}
        />
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="pointer-events-none absolute inset-x-0 top-[42%] z-20 flex justify-center"
          >
            <div
              className={`rounded-3xl px-8 py-4 text-3xl font-black tracking-tight text-white shadow-2xl ${
                flash.tone === 'bust' ? 'bg-danger' : flash.tone === 'max' ? 'bg-accent' : 'bg-success'
              }`}
            >
              {flash.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
