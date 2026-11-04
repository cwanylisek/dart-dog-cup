import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en'
import pl from './pl'

export type Language = 'en' | 'pl'

export function initI18n(language: Language) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, pl: { translation: pl } },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  document.documentElement.lang = language
}

export function setLanguage(language: Language) {
  void i18n.changeLanguage(language)
  document.documentElement.lang = language
}

export default i18n
