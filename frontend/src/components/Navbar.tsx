import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { Lang } from '../types'
import { Logo } from './Logo'

const LANGS: Lang[] = ['en', 'kn']

function LanguageSwitch() {
  const { lang, setLang, t } = useLanguage()
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="inline-flex rounded-full border border-ivory/25 p-0.5 text-sm"
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            lang === code ? 'bg-ivory text-forest' : 'text-ivory/80 hover:text-ivory'
          }`}
        >
          {t.languages[code]}
        </button>
      ))}
    </div>
  )
}

export function Navbar() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#destinations', label: t.nav.destinations },
    { href: '#experiences', label: t.nav.experiences },
    { href: '#how', label: t.nav.how },
    { href: '#kannada', label: t.nav.kannada },
  ]

  return (
    <header className="sticky top-0 z-40 bg-forest text-ivory">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8"
      >
        <a href="#top" className="shrink-0" aria-label="NammaTrip AI">
          <Logo />
        </a>

        <ul className="hidden items-center gap-8 text-[0.95rem] lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-ivory/80 transition-colors hover:text-turmeric">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <a
            href="#plan"
            className="hidden rounded-full bg-turmeric px-5 py-2 text-[0.95rem] font-semibold text-forest-deep transition-colors hover:bg-ivory sm:inline-block"
          >
            {t.nav.plan}
          </a>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-ivory/25 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-ivory/15 px-5 pb-5 lg:hidden">
          <ul className="flex flex-col py-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-ivory/10 py-3 text-lg"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#plan"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-full bg-turmeric px-5 py-3 text-center font-semibold text-forest-deep"
          >
            {t.nav.plan}
          </a>
        </div>
      )}
    </header>
  )
}
