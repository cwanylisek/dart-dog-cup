import type { Language } from '../i18n'

let cachedVoices: SpeechSynthesisVoice[] = []

function voices(): SpeechSynthesisVoice[] {
  if (!cachedVoices.length && 'speechSynthesis' in window) cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoices = window.speechSynthesis.getVoices()
  })
}

export function speak(texts: string[], language: Language) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  const lang = language === 'pl' ? 'pl-PL' : 'en-GB'
  const voice =
    voices().find((v) => v.lang === lang) ?? voices().find((v) => v.lang.toLowerCase().startsWith(language)) ?? null
  synth.cancel()
  for (const text of texts) {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    if (voice) u.voice = voice
    u.rate = 1.05
    synth.speak(u)
  }
}
