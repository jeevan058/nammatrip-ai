import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Lang } from '../types'
import { dict, type Dict } from './strings'

const STORAGE_KEY = 'nammatrip.lang'

interface LanguageValue {
  lang: Lang
  t: Dict
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageValue | null>(null)

function readStoredLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'kn') return stored
  } catch {
    // Storage can be blocked (private windows); fall back to English.
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Ignore storage errors.
    }
  }, [lang])

  const value = useMemo<LanguageValue>(
    () => ({ lang, t: dict[lang], setLang: setLangState }),
    [lang],
  )
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}
