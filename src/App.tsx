import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { ConfirmDialog, PinDialog, Toasts } from './components/Dialogs'
import { useThemeClass } from './hooks/useTheme'
import CounterPage from './pages/counter/CounterPage'
import LeaguePage from './pages/league/LeaguePage'
import PlayersPage from './pages/players/PlayersPage'
import SettingsPage from './pages/settings/SettingsPage'
import { useData } from './store/data'

export default function App() {
  useThemeClass()
  const init = useData((s) => s.init)

  useEffect(() => init(), [init])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/counter" replace />} />
        <Route path="/counter" element={<CounterPage />} />
        <Route path="/league" element={<LeaguePage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/counter" replace />} />
      </Routes>
      <Toasts />
      <PinDialog />
      <ConfirmDialog />
    </HashRouter>
  )
}
