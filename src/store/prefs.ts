import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n'

export type Theme = 'system' | 'light' | 'dark'

interface PrefsState {
  theme: Theme
  language: Language
  voice: boolean
  wakeLock: boolean
  pin: string | null
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setVoice: (voice: boolean) => void
  setWakeLock: (wakeLock: boolean) => void
  setPin: (pin: string | null) => void
}

function defaultLanguage(): Language {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: defaultLanguage(),
      voice: false,
      wakeLock: true,
      pin: null,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setVoice: (voice) => set({ voice }),
      setWakeLock: (wakeLock) => set({ wakeLock }),
      setPin: (pin) => set({ pin }),
    }),
    { name: 'ddc:prefs' },
  ),
)
