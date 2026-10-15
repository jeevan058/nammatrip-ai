import { Check } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export function KannadaSection() {
  const { t, setLang } = useLanguage()

  return (
    <section id="kannada" className="scroll-mt-16 bg-forest py-16 text-ivory sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">{t.kannada.title}</h2>
          <p className="mt-4 max-w-[52ch] text-ivory/80">{t.kannada.body}</p>
          <ul className="mt-6 space-y-3">
            {t.kannada.points.map((point) => (
              <li key={point} className="flex gap-3">
                <Check size={20} className="mt-1 shrink-0 text-turmeric" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <a
            href="#plan"
            onClick={() => setLang('kn')}
            className="mt-9 inline-block rounded-full bg-turmeric px-7 py-3.5 font-semibold text-forest-deep transition-colors hover:bg-ivory"
          >
            {t.kannada.cta}
          </a>
        </div>

        <figure className="rounded-lg border border-ivory/20 bg-forest-deep p-7 sm:p-10">
          <figcaption className="text-sm text-ivory/65">{t.kannada.sampleLabel}</figcaption>
          <blockquote
            lang="kn"
            className="mt-4 font-kannada text-2xl font-medium leading-[1.7] text-ivory sm:text-[1.7rem]"
          >
            {t.kannada.sample}
          </blockquote>
        </figure>
      </div>
    </section>
  )
}
