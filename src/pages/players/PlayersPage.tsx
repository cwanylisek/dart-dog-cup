import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../../components/AppShell'
import { Avatar, PLAYER_COLORS } from '../../components/Avatar'
import { Button, IconButton } from '../../components/Button'
import { Card, EmptyState } from '../../components/Card'
import { CheckIcon, ChevronRight, PlusIcon, TrashIcon, UsersIcon } from '../../components/Icons'
import { Sheet } from '../../components/Sheet'
import { average, checkoutPercent } from '../../engine/x01'
import { uid } from '../../lib/id'
import { emptyLifetime, lifetimeStats } from '../../lib/stats'
import { adminRun } from '../../store/admin'
import { useData } from '../../store/data'
import { confirmDialog } from '../../store/ui'
import type { Player } from '../../types'

export default function PlayersPage() {
  const { t } = useTranslation()
  const players = useData((s) => s.snapshot.players)
  const matches = useData((s) => s.snapshot.matches)
  const stats = useMemo(() => lifetimeStats(matches), [matches])
  const [editing, setEditing] = useState<Player | 'new' | null>(null)

  return (
    <AppShell
      title={t('players.title')}
      right={
        <IconButton label={t('players.add')} onClick={() => setEditing('new')} className="text-accent">
          <PlusIcon />
        </IconButton>
      }
    >
      {players.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={30} />}
          title={t('players.empty')}
          hint={t('players.emptyHint')}
          action={
            <Button onClick={() => setEditing('new')}>
              <PlusIcon size={18} />
              {t('players.add')}
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {players.map((p) => {
            const s = stats.get(p.id) ?? emptyLifetime()
            return (
              <button
                key={p.id}
                onClick={() => setEditing(p)}
                className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 active:bg-surface-2"
              >
                <Avatar name={p.name} color={p.color} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="text-[13px] text-muted">
                    {s.matches ? (
                      <>
                        {t('players.avg')} <b className="tabular text-text">{average(s.stats).toFixed(1)}</b> · {s.wins}/{s.matches}{' '}
                        {t('players.wins').toLowerCase()}
                      </>
                    ) : (
                      t('players.noStats')
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>
            )
          })}
        </Card>
      )}

      <PlayerSheet
        player={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        stats={editing && editing !== 'new' ? stats.get(editing.id) : undefined}
        usedColors={players.map((p) => p.color)}
      />
    </AppShell>
  )
}

function PlayerSheet({
  player,
  open,
  onClose,
  stats,
  usedColors,
}: {
  player: Player | null
  open: boolean
  onClose: () => void
  stats?: ReturnType<typeof emptyLifetime>
  usedColors: string[]
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PLAYER_COLORS[0])

  useEffect(() => {
    if (!open) return
    setName(player?.name ?? '')
    setColor(player?.color ?? PLAYER_COLORS.find((c) => !usedColors.includes(c)) ?? PLAYER_COLORS[0])
    // Only reset when the sheet opens.
  }, [open, player?.id])

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const next: Player = player
      ? { ...player, name: trimmed, color }
      : { id: uid(), name: trimmed, color, created_at: new Date().toISOString() }
    if (await adminRun('savePlayer', next)) onClose()
  }

  const remove = async () => {
    if (!player) return
    if (!(await confirmDialog(t('players.deleteConfirm', { name: player.name }), { danger: true, confirmLabel: t('common.delete') }))) return
    if (await adminRun('deletePlayer', player.id)) onClose()
  }

  const s = stats?.stats
  const statItems = s
    ? [
        { label: t('players.matches'), value: stats!.matches },
        { label: t('players.wins'), value: stats!.wins },
        { label: t('players.avg'), value: average(s).toFixed(1) },
        { label: t('players.co'), value: `${checkoutPercent(s).toFixed(0)}%` },
        { label: t('players.hf'), value: s.highestFinish || '–' },
        { label: t('players.max'), value: s.max180s },
      ]
    : null

  return (
    <Sheet open={open} onClose={onClose} title={player ? t('players.edit') : t('players.add')}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <Avatar name={name || '?'} color={color} size={52} />
          <input
            autoFocus={!player}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('players.name')}
            maxLength={24}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-transparent bg-surface-2 px-4 font-semibold outline-none focus:border-accent"
          />
        </div>

        <div>
          <div className="mb-2 px-1 text-[13px] font-semibold tracking-wider text-muted uppercase">{t('players.color')}</div>
          <div className="flex flex-wrap gap-2.5">
            {PLAYER_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform active:scale-90"
                style={{ background: c, boxShadow: color === c ? `0 0 0 3px var(--surface), 0 0 0 5px ${c}` : undefined }}
              >
                {color === c && <CheckIcon size={18} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {player &&
          (statItems ? (
            <div className="grid grid-cols-3 gap-2">
              {statItems.map((it) => (
                <div key={it.label} className="rounded-2xl bg-surface-2 px-3 py-2.5">
                  <div className="tabular text-lg font-extrabold">{it.value}</div>
                  <div className="text-[11px] font-medium text-muted">{it.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">{t('players.noStats')}</div>
          ))}

        <Button type="submit" size="lg" block disabled={!name.trim()}>
          {t('common.save')}
        </Button>
        {player && (
          <Button type="button" variant="danger" block onClick={() => void remove()}>
            <TrashIcon size={18} />
            {t('common.delete')}
          </Button>
        )}
      </form>
    </Sheet>
  )
}
