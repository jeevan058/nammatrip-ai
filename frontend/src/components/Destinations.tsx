import { Clock } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { fmt } from '../i18n/strings'
import { INTERESTS, type Destination, type Interest } from '../types'
import { DestinationImage } from './DestinationImage'

export type Filter = Interest | 'all'

interface Props {
  status: 'loading' | 'ready' | 'error'
  destinations: Destination[]
  filter: Filter
  onFilter: (filter: Filter) => void
  onOpen: (destination: Destination) => void
  onRetry: () => void
}

const INITIAL_COUNT = 5 // one wide card + one beside it, then a full row of three

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[0.95rem] font-medium transition-colors ${
        active
          ? 'border-forest bg-forest text-ivory'
          : 'border-sage-line bg-paper text-ink-soft hover:border-forest'
      }`}
    >
      {children}
    </button>
  )
}

function Card({
  destination,
  wide,
  onOpen,
}: {
  destination: Destination
  wide: boolean
  onOpen: (d: Destination) => void
}) {
  const { lang, t } = useLanguage()
  const name = lang === 'kn' ? destination.name_kn : destination.name
  return (
    <article className={`group relative ${wide ? 'md:col-span-2' : ''}`}>
      <div className={`overflow-hidden rounded-md ${wide ? 'aspect-[16/10]' : 'aspect-[4/5]'}`}>
        <DestinationImage
          destination={destination}
          className="size-full transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-2xl font-semibold">
          <button
            type="button"
            onClick={() => onOpen(destination)}
            aria-label={`${name}: ${t.destinations.open}`}
            className="text-left after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </button>
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-soft">
          <Clock size={14} aria-hidden="true" />
          {fmt(t.destinations.duration, { h: destination.suggested_duration_hours })}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{destination.region}</p>
      <p className="mt-2 line-clamp-2 max-w-[60ch] text-ink-soft">
        {lang === 'kn' ? destination.description_kn : destination.description}
      </p>
    </article>
  )
}

function Skeletons() {
  return (
    <div className="grid gap-x-8 gap-y-12 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`animate-pulse ${i === 0 ? 'md:col-span-2' : ''}`}>
          <div className={`rounded-md bg-sage ${i === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]'}`} />
          <div className="mt-4 h-6 w-1/2 rounded bg-sage" />
          <div className="mt-2 h-4 w-3/4 rounded bg-sage" />
        </div>
      ))}
    </div>
  )
}

export function Destinations({ status, destinations, filter, onFilter, onOpen, onRetry }: Props) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  const present = INTERESTS.filter((i) => destinations.some((d) => d.categories.includes(i)))
  const filtered =
    filter === 'all' ? destinations : destinations.filter((d) => d.categories.includes(filter))
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)

  return (
    <section id="destinations" className="scroll-mt-16 border-t border-sage-line bg-ivory py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t.destinations.title}</h2>
          <p className="mt-4 text-ink-soft">{t.destinations.intro}</p>
        </div>

        {status === 'ready' && (
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={t.destinations.title}>
            <Chip active={filter === 'all'} onClick={() => onFilter('all')}>
              {t.destinations.all}
            </Chip>
            {present.map((interest) => (
              <Chip key={interest} active={filter === interest} onClick={() => onFilter(interest)}>
                {t.interests[interest]}
              </Chip>
            ))}
          </div>
        )}

        <div className="mt-10">
          {status === 'loading' && <Skeletons />}

          {status === 'error' && (
            <div role="alert" className="rounded-md border border-sage-line bg-paper px-6 py-8">
              <p className="max-w-[50ch] font-medium">{t.destinations.loadError}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-full bg-forest px-6 py-2.5 font-semibold text-ivory transition-colors hover:bg-forest-deep"
              >
                {t.destinations.retry}
              </button>
            </div>
          )}

          {status === 'ready' && filtered.length === 0 && (
            <p className="rounded-md bg-sage px-6 py-5 text-ink-soft">{t.destinations.empty}</p>
          )}

          {status === 'ready' && filtered.length > 0 && (
            <>
              <div className="grid gap-x-8 gap-y-12 md:grid-cols-3">
                {visible.map((destination, index) => (
                  <Card key={destination.id} destination={destination} wide={index === 0} onOpen={onOpen} />
                ))}
              </div>
              {filtered.length > INITIAL_COUNT && (
                <div className="mt-12 text-center">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="rounded-full border border-forest px-7 py-3 font-medium text-forest transition-colors hover:bg-forest hover:text-ivory"
                  >
                    {expanded ? t.destinations.showFewer : fmt(t.destinations.showAll, { n: filtered.length })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
