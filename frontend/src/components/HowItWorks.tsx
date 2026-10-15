import { useLanguage } from '../i18n/LanguageContext'

export function HowItWorks() {
  const { t } = useLanguage()
  return (
    <section id="how" className="scroll-mt-16 bg-ivory py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">{t.how.title}</h2>
        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {t.how.steps.map((step, index) => (
            <li key={step.title} className="border-t border-forest/30 pt-6">
              <span className="grid size-10 place-items-center rounded-full bg-forest font-display text-lg font-semibold text-ivory">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
