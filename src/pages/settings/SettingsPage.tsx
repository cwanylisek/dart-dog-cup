import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../../components/AppShell'
import { Button } from '../../components/Button'
import { Card, Row, SectionTitle } from '../../components/Card'
import { Segmented, Stepper, Switch } from '../../components/Controls'
import { Sheet } from '../../components/Sheet'
import { SyncBadge } from '../../components/SyncBadge'
import { InvalidPinError } from '../../data/repo'
import { setLanguage as applyLanguage, type Language } from '../../i18n'
import { adminRun, requirePin } from '../../store/admin'
import { repo, useData } from '../../store/data'
import { usePrefs, type Theme } from '../../store/prefs'
import { toast } from '../../store/ui'
import type { LeagueSettings } from '../../types'

export default function SettingsPage() {
  const { t } = useTranslation()
  const prefs = usePrefs()
  const settings = useData((s) => s.snapshot.settings)
  const [draft, setDraft] = useState<LeagueSettings>(settings)
  const [changingPin, setChangingPin] = useState(false)

  useEffect(() => setDraft(settings), [settings])

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  const update = <K extends keyof LeagueSettings>(key: K, value: LeagueSettings[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const saveLeague = async () => {
    if (await adminRun('saveSettings', { ...draft, name: draft.name.trim() || settings.name })) toast(t('common.saved'), 'success')
  }

  return (
    <AppShell title={t('settings.title')}>
      <SectionTitle>{t('settings.connection')}</SectionTitle>
      <Card className="px-4 py-3.5">
        <SyncBadge detailed />
      </Card>

      <SectionTitle>{t('settings.appearance')}</SectionTitle>
      <Card className="flex flex-col gap-4 p-4">
        <div>
          <div className="mb-2 text-[15px] font-medium">{t('settings.theme')}</div>
          <Segmented<Theme>
            value={prefs.theme}
            onChange={prefs.setTheme}
            options={[
              { value: 'system', label: t('settings.system') },
              { value: 'light', label: t('settings.light') },
              { value: 'dark', label: t('settings.dark') },
            ]}
          />
        </div>
        <div>
          <div className="mb-2 text-[15px] font-medium">{t('settings.language')}</div>
          <Segmented<Language>
            value={prefs.language}
            onChange={(l) => {
              prefs.setLanguage(l)
              applyLanguage(l)
            }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'pl', label: 'Polski' },
            ]}
          />
        </div>
      </Card>

      <SectionTitle>{t('settings.game')}</SectionTitle>
      <Card>
        <Row label={t('settings.voice')} hint={t('settings.voiceHint')}>
          <Switch checked={prefs.voice} onChange={prefs.setVoice} label={t('settings.voice')} />
        </Row>
        <Row label={t('settings.wakeLock')} hint={t('settings.wakeLockHint')}>
          <Switch checked={prefs.wakeLock} onChange={prefs.setWakeLock} label={t('settings.wakeLock')} />
        </Row>
      </Card>

      <SectionTitle>{t('settings.league')}</SectionTitle>
      <Card>
        <div className="border-b border-line px-4 py-3">
          <div className="mb-1.5 text-[13px] text-muted">{t('settings.leagueName')}</div>
          <input
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            maxLength={40}
            className="h-11 w-full rounded-xl border border-transparent bg-surface-2 px-3 font-semibold outline-none focus:border-accent"
          />
        </div>
        <Row label={t('settings.pointsPerLeg')}>
          <Stepper value={draft.points_per_leg} min={0} max={10} onChange={(v) => update('points_per_leg', v)} />
        </Row>
        <Row label={t('settings.winBonus')}>
          <Stepper value={draft.match_win_bonus} min={0} max={10} onChange={(v) => update('match_win_bonus', v)} />
        </Row>
        <Row label={t('settings.legsToWin')} hint={t('counter.bestOf', { n: draft.legs_to_win * 2 - 1 })}>
          <Stepper value={draft.legs_to_win} min={1} max={11} onChange={(v) => update('legs_to_win', v)} />
        </Row>
        <Row label={t('settings.startScore')}>
          <Segmented
            className="w-36"
            value={draft.start_score}
            onChange={(v) => update('start_score', v)}
            options={[
              { value: 301, label: '301' },
              { value: 501, label: '501' },
            ]}
          />
        </Row>
        <Row label={t('settings.rounds')} hint={t('settings.roundsHint')}>
          <Stepper value={draft.rounds} min={1} max={4} onChange={(v) => update('rounds', v)} />
        </Row>
      </Card>
      {dirty && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setDraft(settings)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void saveLeague()}>{t('common.save')}</Button>
        </div>
      )}

      {repo.mode === 'remote' && (
        <>
          <SectionTitle>{t('settings.admin')}</SectionTitle>
          <Card>
            <Row label={t('settings.pin')} hint={prefs.pin ? t('settings.pinSet') : t('settings.pinNotSet')}>
              {prefs.pin ? (
                <Button size="sm" variant="secondary" onClick={() => prefs.setPin(null)}>
                  {t('settings.forgetPin')}
                </Button>
              ) : (
                <Button size="sm" onClick={() => void requirePin()}>
                  {t('settings.enterPin')}
                </Button>
              )}
            </Row>
            <Row label={t('settings.changePin')} onClick={() => setChangingPin(true)} />
          </Card>
          <ChangePinSheet open={changingPin} onClose={() => setChangingPin(false)} />
        </>
      )}

      <SectionTitle>{t('settings.install')}</SectionTitle>
      <Card className="px-4 py-3.5 text-sm text-muted">{t('settings.installHint')}</Card>

      <div className="mt-8 text-center text-xs text-muted">
        {t('app.name')} · v{__APP_VERSION__}
      </div>
    </AppShell>
  )
}

function ChangePinSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const setPin = usePrefs((s) => s.setPin)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  const submit = async () => {
    if (value.length < 4) return
    const pin = await requirePin()
    if (pin === null) return
    setBusy(true)
    try {
      await repo.changePin(pin, value)
      setPin(value)
      toast(t('settings.pinChanged'), 'success')
      onClose()
    } catch (e) {
      if (e instanceof InvalidPinError) setPin(null)
      toast(e instanceof InvalidPinError ? t('pin.wrong') : t('common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('settings.changePin')}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="flex flex-col gap-4"
      >
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('settings.newPin')}
          className="tabular h-14 rounded-2xl border border-transparent bg-surface-2 text-center text-2xl tracking-[0.4em] outline-none focus:border-accent"
        />
        <Button type="submit" size="lg" block disabled={busy || value.length < 4}>
          {t('common.save')}
        </Button>
      </form>
    </Sheet>
  )
}
