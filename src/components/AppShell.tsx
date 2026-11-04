import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { IconButton } from './Button'
import { CloseIcon, MenuIcon, SettingsIcon, TargetIcon, TrophyIcon, UsersIcon } from './Icons'
import { SyncBadge } from './SyncBadge'

const NAV = [
  { to: '/counter', key: 'nav.counter', icon: TargetIcon },
  { to: '/league', key: 'nav.league', icon: TrophyIcon },
  { to: '/players', key: 'nav.players', icon: UsersIcon },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
] as const

export function AppShell({
  title,
  right,
  children,
  fullHeight = false,
}: {
  title: ReactNode
  right?: ReactNode
  children: ReactNode
  /** For screens like the game that manage their own layout and should not scroll. */
  fullHeight?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className={`mx-auto flex w-full max-w-lg flex-col ${fullHeight ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
      <header className="pt-safe sticky top-0 z-30 bg-bg/85 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-1 px-2">
          <IconButton label={t('nav.menu')} onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
          <div className="min-w-0 flex-1 truncate px-1 text-[17px] font-bold">{title}</div>
          <div className="flex items-center gap-1">{right}</div>
        </div>
      </header>

      <main className={`flex flex-1 flex-col ${fullHeight ? 'min-h-0' : 'pb-safe px-4 pb-8'}`}>{children}</main>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              className="pt-safe pb-safe absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-surface shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80 || info.velocity.x < -500) setOpen(false)
              }}
            >
              <div className="flex items-center gap-3 px-5 pt-4 pb-6">
                <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-11 w-11 rounded-xl" />
                <div className="flex-1">
                  <div className="text-lg font-extrabold leading-tight">{t('app.name')}</div>
                  <div className="mt-1">
                    <SyncBadge />
                  </div>
                </div>
                <IconButton label={t('nav.close')} onClick={() => setOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </div>
              <div className="flex flex-col gap-1 px-3">
                {NAV.map(({ to, key, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[16px] font-semibold transition-colors ${
                        isActive ? 'bg-accent-soft text-accent' : 'text-text active:bg-surface-2'
                      }`
                    }
                  >
                    <Icon />
                    {t(key)}
                  </NavLink>
                ))}
              </div>
              <div className="mt-auto px-6 pb-4 text-xs text-muted">v{__APP_VERSION__}</div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
