import { ArrowUpRight, Camera, Drama, Landmark, Mountain, Trees, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { fmt } from '../i18n/strings'
import type { Destination, Interest } from '../types'

const EXPERIENCES: { interest: Interest; icon: ReactNode }[] = [
  { interest: 'nature', icon: <Trees size={26} /> },
  { interest: 'heritage', icon: <Landmark size={26} /> },
  { interest: 'adventure', icon: <Mountain size={26} /> },
  { interest: 'food', icon: <Utensils size={26} /> },
  { interest: 'culture', icon: <Drama size={26} /> },
  { interest: 'photography', icon: <Camera size={26} /> },
]

export function Experiences({
  destinations,
  onPick,
}: {
  destinations: Destination[]
  onPick: (interest: Interest) => void
}) {
  const { t } = useLanguage()

  return (
    <section id="experiences" className="scroll-mt-16 bg-sage py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t.experiences.title}</h2>
          <p className="mt-4 text-ink-soft">{t.experiences.intro}</p>
        </div>

        <ul className="mt-12 grid gap-x-14 md:grid-cols-2">
          {EXPERIENCES.map(({ interest, icon }) => {
            const count = destinations.filter((d) => d.categories.includes(interest)).length
            return (
              <li key={interest} className="border-t border-forest/25 last:border-b md:nth-last-[2]:border-b">
                <button
                  type="button"
                  onClick={() => onPick(interest)}
                  className="group flex w-full items-start gap-5 py-7 text-left"
                >
                  <span className="mt-1 text-forest">{icon}</span>
                  <span className="flex-1">
                    <span className="block font-display text-2xl font-semibold sm:text-3xl">
                      {t.interests[interest]}
                    </span>
                    <span className="mt-1 block max-w-[40ch] text-ink-soft">
                      {t.experiences.items[interest]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 pt-2 text-sm font-medium text-forest">
                    {count > 0 && fmt(t.experiences.places, { n: count })}
                    <ArrowUpRight
                      size={18}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
