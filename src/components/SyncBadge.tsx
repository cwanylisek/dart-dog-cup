import { useTranslation } from 'react-i18next'
import { repo, useData } from '../store/data'
import { CloudIcon, CloudOffIcon, DeviceIcon } from './Icons'

export function SyncBadge({ detailed = false }: { detailed?: boolean }) {
  const { t } = useTranslation()
  const online = useData((s) => s.online)
  const pending = useData((s) => s.pending.length)

  let icon = <CloudIcon size={16} />
  let label = t('status.online')
  let tone = 'text-success bg-success/10'
  if (repo.mode === 'local') {
    icon = <DeviceIcon size={16} />
    label = t('status.local')
    tone = 'text-muted bg-surface-2'
  } else if (!online || pending > 0) {
    icon = <CloudOffIcon size={16} />
    label = pending > 0 ? t('status.pending', { n: pending }) : t('status.offline')
    tone = 'text-amber-500 bg-amber-500/10'
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
        {icon}
        {label}
      </span>
      {detailed && repo.mode === 'local' && <span className="px-1 text-xs text-muted">{t('status.localHint')}</span>}
    </div>
  )
}
