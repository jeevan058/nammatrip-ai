import { useLanguage } from '../i18n/LanguageContext'
import { Logo } from './Logo'

export function Footer() {
  const { t } = useLanguage()
  const links = [
    { href: '#plan', label: t.nav.plan },
    { href: '#destinations', label: t.nav.destinations },
    { href: '#experiences', label: t.nav.experiences },
    { href: '#how', label: t.nav.how },
  ]

  return (
    <footer className="bg-forest-deep text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[34ch] text-ivory/75">{t.footer.tagline}</p>
        </div>

        <nav aria-label={t.footer.explore}>
          <h2 className="text-base font-semibold">{t.footer.explore}</h2>
          <ul className="mt-3 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-ivory/75 transition-colors hover:text-turmeric">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm text-ivory/65">
          <p>{t.footer.disclaimer}</p>
          <p className="mt-3">{t.footer.built}</p>
        </div>
      </div>
    </footer>
  )
}
