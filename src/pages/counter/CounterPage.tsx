import { useTranslation } from 'react-i18next'
import { AppShell } from '../../components/AppShell'
import { IconButton } from '../../components/Button'
import { CloseIcon } from '../../components/Icons'
import { replay } from '../../engine/x01'
import { useGame } from '../../store/game'
import { confirmDialog } from '../../store/ui'
import { Game } from './Game'
import { Setup } from './Setup'
import { Summary } from './Summary'

export default function CounterPage() {
  const { t } = useTranslation()
  const config = useGame((s) => s.config)
  const darts = useGame((s) => s.darts)
  const fixtureId = useGame((s) => s.fixtureId)
  const quit = useGame((s) => s.quit)

  if (!config) {
    return (
      <AppShell title={t('counter.newGame')}>
        <Setup />
      </AppShell>
    )
  }

  const state = replay(config, darts)
  const finished = state.winner !== null
  const legNo = state.legs.length
  const title = (
    <span className="flex items-baseline gap-2">
      <span>{config.startScore}</span>
      <span className="text-sm font-semibold text-muted">
        {fixtureId ? `${t('counter.leagueMatch')} · ` : ''}
        {config.setsToWin > 1 ? `${t('counter.set', { n: state.legs.at(-1)!.set + 1 })} · ` : ''}
        {t('counter.leg', { n: legNo })}
      </span>
    </span>
  )

  const onQuit = async () => {
    if (darts.length === 0 || (await confirmDialog(t('counter.quitConfirm'), { danger: true, confirmLabel: t('counter.quit') }))) {
      quit()
    }
  }

  return (
    <AppShell
      title={finished ? t('summary.title') : title}
      fullHeight={!finished}
      right={
        !finished && (
          <IconButton label={t('counter.quit')} onClick={() => void onQuit()}>
            <CloseIcon />
          </IconButton>
        )
      }
    >
      {finished ? <Summary config={config} darts={darts} /> : <Game config={config} darts={darts} />}
    </AppShell>
  )
}
